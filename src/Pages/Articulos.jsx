import React, { useEffect, useMemo, useState } from "react";
import { db } from "../Components/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { useCartStore } from "../Components/useCartStore";
import "./Articulos.css";

const PAGE_SIZE = 12;

export default function Articulos() {
  const addItem = useCartStore((s) => s.addItem);
  const totalQty = useCartStore((s) => s.totalQty());

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [qText, setQText] = useState("");
  const [category, setCategory] = useState("all"); // "all" = Todas
  const [categories, setCategories] = useState(["all"]); // dinámicas
  const [errorMsg, setErrorMsg] = useState("");

  const qNorm = useMemo(() => qText.trim().toLowerCase(), [qText]);

  useEffect(() => {
    // Primera carga o cuando cambia la categoría
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Reconstruye categorías a partir de los productos cargados
  useEffect(() => {
    const set = new Set(["all"]);
    for (const p of items) {
      if (p?.category) set.add(String(p.category));
    }
    setCategories(Array.from(set));
  }, [items]);

  async function fetchPage(reset = false) {
    setLoading(true);
    setErrorMsg("");
    try {
      const base = collection(db, "articulos");
      const constraints = [where("active", "==", true)];

      if (category !== "all") {
        constraints.push(where("category", "==", category));
      }

      constraints.push(orderBy("createdAt", "desc"));

      if (!reset && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(PAGE_SIZE));

      const snap = await getDocs(query(base, ...constraints));

      let docsArr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Búsqueda en cliente (texto)
      if (qNorm) {
        docsArr = docsArr.filter(
          (d) =>
            String(d.title || "").toLowerCase().includes(qNorm) ||
            String(d.slug || "").toLowerCase().includes(qNorm) ||
            String(d.category || "").toLowerCase().includes(qNorm)
        );
      }

      if (reset) {
        setItems(docsArr);
      } else {
        setItems((prev) => [...prev, ...docsArr]);
      }

      setHasMore(snap.size === PAGE_SIZE);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
    } catch (err) {
      console.error("Error Firestore (plan principal). Intentando plan B:", err);
      setErrorMsg(
        "No se pudo cargar con el orden por fecha. Probando un modo compatible…"
      );

      // ---- Plan B: sin orderBy para evitar requerir índice compuesto ----
      try {
        const base = collection(db, "articulos");
        const simple = [where("active", "==", true)];
        if (category !== "all") simple.push(where("category", "==", category));
        simple.push(limit(PAGE_SIZE));

        const snap2 = await getDocs(query(base, ...simple));
        let docsArr2 = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Orden en cliente por createdAt desc (si existe)
        docsArr2.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });

        if (qNorm) {
          docsArr2 = docsArr2.filter(
            (d) =>
              String(d.title || "").toLowerCase().includes(qNorm) ||
              String(d.slug || "").toLowerCase().includes(qNorm) ||
              String(d.category || "").toLowerCase().includes(qNorm)
          );
        }

        if (reset) setItems(docsArr2);
        else setItems((prev) => [...prev, ...docsArr2]);

        // En plan B desactivamos la paginación basada en startAfter
        setHasMore(false);
        setLastDoc(null);
      } catch (err2) {
        console.error("Error también en plan B:", err2);
        setErrorMsg("No se pudo cargar los artículos. Revisa la consola.");
      }
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setItems([]);
    setLastDoc(null);
    setHasMore(false);
    fetchPage(true);
  }

  return (
    <div className="prod-container">
      <div className="prod-toolbar">
        <input
          className="prod-search"
          placeholder="Buscar productos…"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && resetSearch()}
        />

        <select
          className="prod-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Todas las categorías" : c}
            </option>
          ))}
        </select>

        <button className="prod-secondary" onClick={resetSearch}>
          Buscar / Refrescar
        </button>

        <div className="prod-cart-chip">Carrito: {totalQty}</div>
      </div>

      {errorMsg && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px solid #fde68a",
            background: "#fffbeb",
            borderRadius: 8,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div className="prod-grid">
        {items.length === 0 && !loading && (
          <div className="prod-empty">No se encontraron artículos.</div>
        )}

        {items.map((p) => {
          const image = p.images?.[0]?.url || "";
          const price = Number(p.price || 0);
          const disabled = !p.active || (p.stock ?? 0) <= 0;

          return (
            <div key={p.id} className="prod-card">
              <div className="prod-thumb">
                {image ? (
                  <img src={image} alt={p.title} />
                ) : (
                  <div className="prod-thumb--empty">Sin imagen</div>
                )}
              </div>
              <div className="prod-body">
                <h3 className="prod-title">{p.title}</h3>
                <div className="prod-price">${price.toLocaleString()}</div>
                <div className="prod-stock">
                  {(p.stock ?? 0) > 0 ? `Stock: ${p.stock}` : "Sin stock"}
                </div>
              </div>
              <div className="prod-actions">
                <button
                  className="prod-primary"
                  disabled={disabled}
                  onClick={() =>
                    addItem(
                      {
                        id: p.id,
                        title: p.title,
                        price: price,
                        image,
                        stock: p.stock ?? 0,
                        active: !!p.active,
                      },
                      1
                    )
                  }
                >
                  {disabled ? "No disponible" : "Agregar al carrito"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="prod-pagination">
        <button
          className="prod-secondary"
          disabled={!hasMore || loading}
          onClick={() => fetchPage(false)}
        >
          {loading ? "Cargando..." : "Cargar más"}
        </button>
      </div>
    </div>
  );
}
