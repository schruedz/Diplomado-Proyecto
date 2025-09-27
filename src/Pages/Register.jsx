import React, { useState } from "react";
import { auth, db } from "../Components/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      // 1) Crear usuario en Auth
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = cred.user;

      // 2) Actualizar displayName en Auth (opcional pero recomendado)
      await updateProfile(user, {
        displayName: `${formData.name} ${formData.lastName}`.trim(),
      });

      // 3) Guardar perfil en Firestore
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: formData.name.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: "user", // cambia a "admin" manualmente si necesitas
        createdAt: serverTimestamp(),
      });

      alert("Usuario registrado con éxito");
      navigate("/");
    } catch (err) {
      console.error("Error registrando usuario:", err);
      const map = {
        "auth/email-already-in-use": "Este correo ya está registrado.",
        "auth/invalid-email": "Correo inválido.",
        "auth/weak-password": "La contraseña es muy débil (mínimo 6 caracteres).",
        "auth/network-request-failed": "Problema de conexión. Intenta de nuevo.",
      };
      setErrorMsg(map[err.code] || "Ocurrió un error al registrar el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page">
      <form onSubmit={handleSubmit} className="form" noValidate>
        <h1>Formulario Registro</h1>

        <div className="input-container">
          <input
            type="text"
            name="name"
            className="input"
            placeholder=" "
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="given-name"
          />
          <label className="label">Nombre</label>
        </div>

        <div className="input-container">
          <input
            type="text"
            name="lastName"
            className="input"
            placeholder=" "
            value={formData.lastName}
            onChange={handleChange}
            required
            autoComplete="family-name"
          />
          <label className="label">Apellido</label>
        </div>

        <div className="input-container">
          <input
            type="email"
            name="email"
            className="input"
            placeholder=" "
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <label className="label">Correo Electrónico</label>
        </div>

        <div className="input-container">
          <input
            type="password"
            name="password"
            className="input"
            placeholder=" "
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            minLength={6}
          />
          <label className="label">Contraseña</label>
        </div>

        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Registrando..." : "Registrar"}
        </button>

        <div className="login-prompt">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="btn-link"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;
