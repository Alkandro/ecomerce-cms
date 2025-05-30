import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Users from "./pages/Users";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import PrivateRoute from "./components/PrivateRoute";
import NotAuthorized from "./pages/NotAuthorized";
import Banners from "./pages/Banners";
import Orders from "./pages/Orders";
// ¡Importa el nuevo componente para la pantalla de Términos y Condiciones!
import TermsConditionsScreen from "./components/TermsConditionsScreen"; // Asegúrate de que esta ruta sea correcta
import UserDetail from "./pages/UserDetail";
import "./App.css";

// Componente auxiliar para redirigir desde la raíz
function RootRedirect() {
  const isAuthenticated = localStorage.getItem("user") !== null;

  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/not-authorized" element={<NotAuthorized />} />

        <Route path="/" element={<RootRedirect />} />

        {/* Las rutas privadas ahora solo necesitan PrivateRoute */}
        <Route
          path="/dashboard"
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
          path="/orders"
          element={
            <PrivateRoute>
              <Orders />
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
        <Route path="/users/:userId" element={<UserDetail />} />
        <Route
          path="/change-password"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        {/* ¡NUEVA RUTA PARA TÉRMINOS Y CONDICIONES! */}
        <Route
          path="/terms-conditions"
          element={
            <PrivateRoute>
              <TermsConditionsScreen />{" "}
              {/* Asegúrate de que este es el nombre de tu componente */}
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
