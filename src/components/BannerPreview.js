// src/components/BannerPreview.js
import React from "react";
import "./BannerPreview.css"; // Crea este archivo CSS

function BannerPreview({ banners }) {
  return (
    <div className="banner-preview-container">
      {banners.map((banner, index) => (
        <div key={index} className="banner-preview-item">
          <img src={banner.image} alt={`Banner ${banner.position}`} />
          <p>Posición: {banner.position}</p>
        </div>
      ))}
    </div>
  );
}

export default BannerPreview;