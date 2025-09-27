import React, { useState } from "react";
import { auth, db } from "../Components/firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./register.css"; // Asegúrate de tener este archivo CSS

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        email: "",
        password: "",
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                name: formData.name,
                lastName: formData.lastName,
                email: formData.email,
                role: "user", 
            });

            alert("Usuario registrado con éxito");
            navigate("/"); 
        } catch (error) {
            console.error("Error registrando usuario:", error);
            alert(error.message);
        }
    };

    return (
        <div className="container-page">
            <form onSubmit={handleSubmit} className="form">
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
                    />
                    <label className="label">Contraseña</label>
                </div>

                <button type="submit" className="btn-primary">Registrar</button>

                <div className="login-prompt">
                    <p>¿Ya tienes una cuenta? <button onClick={() => navigate("/login")} className="btn-link">Inicia sesión</button></p>
                </div>
            </form>
        </div>
    );
};

export default Register;
