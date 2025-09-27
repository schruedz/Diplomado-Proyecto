import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useCartStore } from "../Components/useCartStore";
import "./NavBar.css";

const NavBar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const navigate = useNavigate();

  const totalQty = useCartStore((s) => s.totalQty());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          const data = snap.exists() ? snap.data() : {};
          setRole(data?.role || null);
          setUserName(data?.name || user.displayName || user.email);
        } catch (error) {
          console.error("Error obteniendo datos de usuario:", error);
          setRole(null);
          setUserName(user.displayName || user.email);
        }
      } else {
        setIsLoggedIn(false);
        setRole(null);
        setUserName(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAlertMessage("Cerraste sesión exitosamente");
      setAlertVisible(true);
      setTimeout(() => {
        setAlertVisible(false);
        setAlertMessage("");
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <nav className="navbar">
      <ul className="nav-list">
        <li className="nav-item">
          <Link to="/" className="nav-link">Inicio</Link>
        </li>

        {!loadingAuth && !isLoggedIn && (
          <li className="nav-item">
            <Link to="/login" className="nav-link">Login</Link>
          </li>
        )}

        {!loadingAuth && isLoggedIn && (
          <>
            <li className="nav-item">
              <Link to="/articulos" className="nav-link">Artículos</Link>
            </li>

            {role === "admin" && (
              <li className="nav-item">
                <Link to="/gestion-articulos" className="nav-link">Gestión Artículos</Link>
              </li>
            )}

            <li className="nav-item user-chip">{userName}</li>
            <li className="nav-item user-chip">Carrito: {totalQty}</li>

            <li className="nav-item">
              <button onClick={handleLogout} className="logout-button">
                Cerrar Sesión
              </button>
            </li>
          </>
        )}
      </ul>
      {alertVisible && <div className="alert-message">{alertMessage}</div>}
    </nav>
  );
};

export default NavBar;
