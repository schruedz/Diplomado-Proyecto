import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth"; 
import { auth } from "./firebase"; 
import { doc, getDoc } from "firebase/firestore"; // 👈 Firestore
import { db } from "./firebase"; // 👈 asegúrate que exportas `db` en firebase.js
import "./NavBar.css";

const NavBar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null); // 👈 nuevo estado para rol
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);

        // Leer rol desde Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role); // 👈 asigna el rol del documento
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Error obteniendo rol:", error);
        }
      } else {
        setIsLoggedIn(false);
        setRole(null);
      }
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

        {!isLoggedIn && (
          <li className="nav-item">
            <Link to="/login" className="nav-link">Login</Link>
          </li>
        )}

        {isLoggedIn && (
          <>
            <li className="nav-item">
              <Link to="/articulos" className="nav-link">Artículos</Link>
            </li>

            {/*Verificador del Rol admin*/}
            {role === "admin" && (
              <li className="nav-item">
                <Link to="/gestion-articulos" className="nav-link">
                  Gestión Artículos
                </Link>
              </li>
            )}

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
