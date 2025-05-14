import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Users from "./pages/Users";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import PrivateRoute from "./components/PrivateRoute";
import NotAuthorized from "./pages/NotAuthorized";
import Banners from "./pages/Banners";
import "./App.css";

// Componente auxiliar para redirigir desde la raíz
function RootRedirect() {
  // Aquí puedes añadir la lógica para comprobar si el usuario está autenticado
  // Basándonos en tu Login.js, asumimos que guardas el usuario en localStorage
  const isAuthenticated = localStorage.getItem("user") !== null;

  if (isAuthenticated) {
    // Si está autenticado, redirige a /products
    return <Navigate to="/products" replace />;
  } else {
    // Si no está autenticado, podrías redirigir a login o dejar que PrivateRoute lo haga
    // En este caso, PrivateRoute en la ruta / probablemente ya redirige a /login
    // Pero para mayor claridad, podrías redirigir explícitamente aquí si lo prefieres
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/not-authorized" element={<NotAuthorized />} />

        {/* Usa el componente RootRedirect para la ruta raíz */}
        <Route path="/" element={<RootRedirect />} />

        {/* Las rutas privadas ahora solo necesitan PrivateRoute */}
        <Route
          path="/dashboard" // Cambié la ruta del dashboard para que no sea la raíz
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          }
        />
        <Route
          path="/banners"
          element={
            <PrivateRoute>
              <Banners />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;