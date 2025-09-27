// src/Pages/GestionArticulos.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db, storage } from "../Components/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import "./GestionArticulos.css";

/* ======== Utilidades ======== */
const COLLECTION = "articulos";

const emptyProduct = {
  title: "",
  price: "",
  stock: "",
  category: "",
  description: "",
  active: true,
  images: [],
};

function validateProduct(p) {
  const errors = {};
  if (!p.title?.trim()) errors.title = "Título requerido";
  if (!p.price || Number(p.price) <= 0) errors.price = "Precio > 0";
  if (p.stock === "" || Number(p.stock) < 0) errors.stock = "Stock ≥ 0";
  if (!p.category?.trim()) errors.category = "Categoría requerida";
  return errors;
}

/* ======== Subida de imágenes ======== */
async function uploadImage(file, productId, onProgress) {
  const path = `articulos/${productId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      }
    );
  });
}

async function deleteImageByPath(path) {
  try {
    await deleteObject(ref(storage, path));
  } catch{
    // Silenciar (si ya no existe)
  }
}

/* ======== Componente principal ======== */
export default function GestionArticulos() {
  // Tabla
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [qText, setQText] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [categories, setCategories] = useState([]);

  // Formulario
  const [form, setForm] = useState(emptyProduct);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const fileInputRef = useRef(null);

  const pageSize = 8;

  const qNormalized = useMemo(() => qText.trim().toLowerCase(), [qText]);

  useEffect(() => {
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const set = new Set();
    for (const p of items) {
      if (p?.category) set.add(String(p.category));
    }
    setCategories(Array.from(set).sort((a, b) => a.localeCompare(b)));
  }, [items]);

  async function fetchPage(reset = false) {
    setLoadingList(true);
    try {
      const base = collection(db, COLLECTION);
      const constraints = [];

      if (onlyActive) constraints.push(where("active", "==", true));
      constraints.push(orderBy("createdAt", "desc"));
      if (!reset && lastDoc) constraints.push(startAfter(lastDoc));
      constraints.push(limit(pageSize));

      const snap = await getDocs(query(base, ...constraints));
      let docsArr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (qNormalized) {
        docsArr = docsArr.filter((d) => {
          const hay =
            d.title?.toLowerCase().includes(qNormalized) ||
            d.category?.toLowerCase().includes(qNormalized);
          return hay;
        });
      }

      setHasMore(snap.size === pageSize);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setItems((prev) => (reset ? docsArr : [...prev, ...docsArr]));
    } catch (err) {
      console.error("Error cargando artículos:", err);
    } finally {
      setLoadingList(false);
    }
  }

  function resetPaginationAndSearch() {
    setItems([]);
    setLastDoc(null);
    setHasMore(false);
    fetchPage(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      title: p.title || "",
      price: p.price ?? "",
      stock: p.stock ?? "",
      category: p.category || "",
      description: p.description || "",
      active: !!p.active,
      images: Array.isArray(p.images) ? p.images : [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    setEditingId(null);
    setForm(emptyProduct);
    setErrors({});
    setUploadPct(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUploadImages(files) {
    if (!files?.length) return;
    try {
      setSaving(true);
      setUploadPct(0);
      const pid = editingId || "temp";

      const uploaded = [];
      for (const file of files) {
        const img = await uploadImage(file, pid, setUploadPct);
        uploaded.push(img);
      }
      setForm((s) => ({
        ...s,
        images: [...(s.images || []), ...uploaded],
      }));
    } catch (err) {
      console.error("Error subiendo imágenes:", err);
      alert("Error al subir imágenes");
    } finally {
      setSaving(false);
      setUploadPct(0);
    }
  }

  async function removeImage(idx) {
    const img = form.images?.[idx];
    if (!img) return;
    if (confirm("¿Eliminar esta imagen permanentemente?")) {
      await deleteImageByPath(img.path);
      setForm((s) => {
        const next = [...s.images];
        next.splice(idx, 1);
        return { ...s, images: next };
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const normalizedCategory = String(form.category || "")
      .trim()
      .replace(/\s+/g, " ");

    const data = {
      ...form,
      category: normalizedCategory,
      price: Number(form.price),
      stock: Number(form.stock),
    };
    const v = validateProduct(data);
    setErrors(v);
    if (Object.keys(v).length) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, COLLECTION, editingId), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        setItems((prev) =>
          prev.map((it) => (it.id === editingId ? { ...it, ...data } : it))
        );
        clearForm();
        alert("Artículo actualizado");
      } else {
        const refDoc = await addDoc(collection(db, COLLECTION), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setItems((prev) => [{ id: refDoc.id, ...data }, ...prev]);
        clearForm();
        alert("Artículo creado");
      }
    } catch (err) {
      console.error("Error guardando artículo:", err);
      alert("No se pudo guardar el artículo");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p) {
    try {
      await updateDoc(doc(db, COLLECTION, p.id), {
        active: !p.active,
        updatedAt: serverTimestamp(),
      });
      setItems((prev) =>
        prev.map((it) => (it.id === p.id ? { ...it, active: !it.active } : it))
      );
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  }

  async function removeProduct(p) {
    if (!confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`))
      return;
    try {
      if (Array.isArray(p.images)) {
        await Promise.all(
          p.images.map((img) =>
            img?.path ? deleteImageByPath(img.path) : null
          )
        );
      }
      await deleteDoc(doc(db, COLLECTION, p.id));
      setItems((prev) => prev.filter((it) => it.id !== p.id));
    } catch (err) {
      console.error("Error eliminando artículo:", err);
      alert("No se pudo eliminar");
    }
  }

  return (
    <div className="ga-container">
      <h1>Gestión de Artículos</h1>

      {/* ====== Formulario ====== */}
      <form className="ga-form" onSubmit={handleSubmit}>
        <div className="ga-row">
          <div className="ga-col">
            <label>Título</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej: Silla Gamer Pro"
            />
            {errors.title && <small className="ga-error">{errors.title}</small>}
          </div>
        </div>

        <div className="ga-row">
          <div className="ga-col">
            <label>Precio</label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="0.00"
            />
            {errors.price && <small className="ga-error">{errors.price}</small>}
          </div>
          <div className="ga-col">
            <label>Stock</label>
            <input
              type="number"
              min="0"
              step="1"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              placeholder="0"
            />
            {errors.stock && <small className="ga-error">{errors.stock}</small>}
          </div>
          <div className="ga-col">
            <label>Categoría</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              list="ga-categories"
              placeholder="Ej: Sillas"
            />
            <datalist id="ga-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.category && (
              <small className="ga-error">{errors.category}</small>
            )}
          </div>
        </div>

        <div className="ga-row">
          <div className="ga-col">
            <label>Descripción</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Resumen del producto…"
            />
          </div>
        </div>

        <div className="ga-row ga-upload">
          <div className="ga-col">
            <label>Imágenes</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUploadImages(e.target.files)}
            />
            {uploadPct > 0 && uploadPct < 100 && (
              <div className="ga-progress">Subiendo… {uploadPct}%</div>
            )}
            <div className="ga-images">
              {(form.images || []).map((img, idx) => (
                <div key={idx} className="ga-image">
                  <img src={img.url} alt={`img-${idx}`} />
                  <button
                    type="button"
                    className="ga-danger"
                    onClick={() => removeImage(idx)}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="ga-col ga-switch">
            <label>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              Activo
            </label>
          </div>
        </div>

        <div className="ga-actions">
          <button type="submit" className="ga-primary" disabled={saving}>
            {editingId ? "Actualizar" : "Crear artículo"}
          </button>
          {editingId && (
            <button
              type="button"
              className="ga-secondary"
              onClick={clearForm}
              disabled={saving}
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {/* ====== Filtros / Búsqueda ====== */}
      <div className="ga-toolbar">
        <input
          className="ga-search"
          placeholder="Buscar por título o categoría…"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && resetPaginationAndSearch()}
        />
        <label className="ga-check">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => {
              setOnlyActive(e.target.checked);
              setItems([]);
              setLastDoc(null);
              setHasMore(false);
              fetchPage(true);
            }}
          />
          Solo activos
        </label>
        <button
          className="ga-secondary"
          onClick={() => resetPaginationAndSearch()}
        >
          Buscar / Refrescar
        </button>
      </div>

      {/* ====== Tabla ====== */}
      <div className="ga-table-wrap">
        <table className="ga-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Título</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoría</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loadingList && items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center" }}>
                  No hay artículos
                </td>
              </tr>
            )}

            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.images?.[0]?.url ? (
                    <img
                      className="ga-thumb"
                      src={p.images[0].url}
                      alt={p.title}
                    />
                  ) : (
                    <div className="ga-thumb ga-thumb--empty">—</div>
                  )}
                </td>
                <td>
                  <div className="ga-title">{p.title}</div>
                </td>
                <td>${Number(p.price || 0).toLocaleString()}</td>
                <td>{p.stock ?? 0}</td>
                <td>{p.category || "—"}</td>
                <td>
                  <span className={`ga-badge ${p.active ? "ok" : "off"}`}>
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="ga-actions-cell">
                  <button className="ga-small" onClick={() => startEdit(p)}>
                    Editar
                  </button>
                  <button className="ga-small" onClick={() => toggleActive(p)}>
                    {p.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    className="ga-small ga-danger"
                    onClick={() => removeProduct(p)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ga-pagination">
          <button
            className="ga-secondary"
            disabled={!hasMore || loadingList}
            onClick={() => fetchPage(false)}
          >
            {loadingList ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      </div>
    </div>
  );
}
