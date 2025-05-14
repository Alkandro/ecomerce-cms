// src/pages/Banners.js
import React from "react";
import MainLayout from "../layouts/MainLayout";
import BannerForm from "../components/BannerForm";

function Banners() {
  return (
    <MainLayout>
      <div className="banners-center">
        <h2>Administrar Banners</h2>
        <h3>Agregar nuevo banner</h3>
        <BannerForm onAdd={() => window.location.reload()} />
        {/* Aquí podrías agregar una lista de banners existentes más adelante */}
      </div>
    </MainLayout>
  );
}

export default Banners;