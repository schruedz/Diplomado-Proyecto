import { Routes, Route } from "react-router-dom";
import NavBar from "./Components/NavBar";
import Login from "./Pages/Login";
import Register from "./Pages/Register";     // si tienes registro
import Articulos from "./Pages/Articulos";   // tu componente de artículos
import GestionArticulos from "./Pages/GestionArticulos"; // 👈 nuevo
import "./App.css";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<h1>Bienvenido al Home</h1>} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Registro */}
        <Route path="/register" element={<Register />} />

        {/* Artículos */}
        <Route path="/articulos" element={<Articulos />} />

        {/* Gestión de artículos (solo admin debería verla en el NavBar) */}
        <Route path="/gestion-articulos" element={<GestionArticulos />} />

        {/* Ruta por defecto */}
        <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
      </Routes>
    </>
  );
}

export default App;
