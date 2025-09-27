import React, { useState } from "react";
import { auth } from "../Components/firebase";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import "../Pages/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      const map = {
        "auth/invalid-credential": "Correo o contraseña inválidos.",
        "auth/user-not-found": "Usuario no registrado.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
      };
      setError(map[err.code] || "Error iniciando sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="container-page">
      <form className="form" onSubmit={handleSubmit}>
        <h1>Iniciar Sesión</h1>

        <div className="input-container">
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="input-container">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Accediendo..." : "Acceder"}
        </button>

        <button type="button" className="btn-secondary" onClick={handleRegister}>
          Regístrate
        </button>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default Login;
