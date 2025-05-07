import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("ale@a.com");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email !== "ale@a.com") {
      alert("Solo el administrador puede acceder.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // 👇 Guardar el usuario en localStorage
      localStorage.setItem("user", JSON.stringify(userCredential.user));
      navigate("/products");
    } catch (error) {
      alert("Credenciales inválidas");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Admin CMS Login</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
        />
        <button type="submit">Iniciar sesión</button>
      </form>
    </div>
  );
}

export default Login;
