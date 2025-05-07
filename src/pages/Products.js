// src/pages/Products.js
import React from "react";
import MainLayout from "../layouts/MainLayout";
import ProductList from "../components/ProductList";

function Products() {
  return (
    <MainLayout>
      <h2>Productos existentes</h2>
      <ProductList />
    </MainLayout>
  );
}

export default Products;
