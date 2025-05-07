import React from "react";
import Sidebar from "../components/Sidebar"; // ✅ usar el componente

export default function MainLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar /> {/* ✅ sólo uno aquí */}
      <main className="main-content">{children}</main>
    </div>
  );
}
