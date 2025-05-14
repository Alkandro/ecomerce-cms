// src/components/Sidebar.js
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <h2 className="logo">CMS</h2>
      <nav>
        <ul className="nav-list">
          <li className={location.pathname === "/products" ? "active" : ""}>
            <Link to="/products">Products</Link>
          </li>
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            {" "}
            {/* Cambia "/" por "/dashboard" */}
            <Link to="/dashboard">Agregar productos</Link>
          </li>
          <li className={location.pathname === "/banners" ? "active" : ""}>
            <Link to="/banners">Banners</Link>
          </li>
          <li className={location.pathname === "/users" ? "active" : ""}>
            <Link to="/users">Users</Link>
          </li>
          <li
            className={location.pathname === "/change-password" ? "active" : ""}
          >
            <Link to="/change-password">Cambiar contraseña</Link>
          </li>
        </ul>
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <FiLogOut style={{ marginRight: 8 }} />
        Cerrar sesión
      </button>
    </aside>
  );
}

export default Sidebar;
