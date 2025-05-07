// src/pages/Dashboard.js
import React from "react";
import MainLayout from "../layouts/MainLayout";
import ProductForm from "../components/ProductForm";

function Dashboard() {
  return (
    <MainLayout>
      <div className="dashboard-center">
      <h2>Bienvenido al panel de administración</h2>
      <h2>Agregar nuevo producto</h2>
      <ProductForm onAdd={() => window.location.reload()} />
      </div>
    </MainLayout>
  );
}

export default Dashboard;
