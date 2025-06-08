// src/pages/Banners.js
import React from "react";
import MainLayout from "../layouts/MainLayout";
import BannerForm from "../components/BannerForm";
import "../Styles/Banners.css";

function Banners() {
  return (
    <MainLayout>
      <div className="banners-center">
        <h2>Administrador de Banners</h2>

        <BannerForm onAdd={() => window.location.reload()} />
        {/* Aquí podrías agregar una lista de banners existentes más adelante */}
      </div>
    </MainLayout>
  );
}

export default Banners;
