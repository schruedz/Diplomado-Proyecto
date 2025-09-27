import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setState({ loading: false, allowed: false });
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.exists() ? snap.data().role : null;
        setState({ loading: false, allowed: role === "admin" });
      } catch {
        setState({ loading: false, allowed: false });
      }
    });
    return () => unsub();
  }, []);

  if (state.loading) return <div>Cargando…</div>;
  return state.allowed ? children : <Navigate to="/" replace />;
}
