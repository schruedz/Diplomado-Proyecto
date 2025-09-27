import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState({ loading: true, allowed: false });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setStatus({ loading: false, allowed: false });
      setStatus({ loading: false, allowed: true });
    });
    return () => unsub();
  }, []);

  if (status.loading) return <div>Cargando…</div>;
  return status.allowed ? children : <Navigate to="/login" replace />;
}
