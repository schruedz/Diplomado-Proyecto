import React, { useState } from "react";
import { auth } from "../Components/firebase"; // asegúrate que el path es correcto
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import "../Pages/Login.css"

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // estado para manejar errores
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // limpiar error previo
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Inicio de sesión exitoso");
      navigate("/"); // Redirigir a la página principal después del login
    } catch (error) {
      console.error("Error iniciando sesión:", error);
      setError("Credenciales incorrectas o usuario no registrado");
    }
  };

  const handleRegister = () => {
    navigate("/register"); // Redirigir a la página de registro
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

        <button type="submit" className="btn-primary">
          Acceder
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
