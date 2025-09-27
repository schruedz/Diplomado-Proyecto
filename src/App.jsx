import { Routes, Route } from "react-router-dom";
import NavBar from "./Components/NavBar";
import Login from "./Pages/Login";        // 👈 Ajusta la ruta si tu Login está en otra carpeta
import Register from "./Pages/Register";  // 👈 Solo si tienes componente Register
import Articulos from "./Pages/Articulos"; // 👈 Crea este componente
import "./App.css";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Ruta principal */}
        <Route path="/" element={<h1>Bienvenido al Home</h1>} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Registro */}
        <Route path="/register" element={<Register />} />

        {/* Artículos */}
        <Route path="/articulos" element={<Articulos />} />

        {/* Ruta por defecto (si no existe la ruta) */}
        <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
      </Routes>
    </>
  );
}

export default App;
