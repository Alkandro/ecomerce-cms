import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";
// Importa los iconos de react-icons. Aquí usamos 'FaEye' y 'FaEyeSlash' de Font Awesome.
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

function Login() {
  const [email, setEmail] = useState("ale@a.com");
  const [password, setPassword] = useState("");
  // Nuevo estado para controlar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false); 
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
        {/* Contenedor para el input de contraseña y el icono */}
        <div className="password-input-container"> 
  <input
    type={showPassword ? "text" : "password"} 
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Contraseña"
    className="password-input" // Puedes añadir una clase aquí si necesitas más estilos
  />
  <span 
    onClick={() => setShowPassword(v => !v)}
    className="password-toggle-icon"
  >
    {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />} 
  </span>
</div>
        <button type="submit">Iniciar sesión</button>
      </form>
    </div>
  );
}

export default Login;