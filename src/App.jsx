import { Routes, Route } from "react-router-dom";
import NavBar from "./Components/NavBar";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Articulos from "./Pages/Articulos";
import GestionArticulos from "./Pages/GestionArticulos";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminRoute from "./Components/AdminRoute";
import "./App.css";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<h1>Bienvenido al Home</h1>} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/articulos"
          element={
            <ProtectedRoute>
              <Articulos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion-articulos"
          element={
            <AdminRoute>
              <GestionArticulos />
            </AdminRoute>
          }
        />

        <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
      </Routes>
    </>
  );
}

export default App;
