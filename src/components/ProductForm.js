import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "./ProductForm.css";

function ProductForm({ onAdd }) {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    discount: "",
    description: "",
    tags: "",
    image: "",
  });
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setProduct({ ...product, image: reader.result });
      setPreview(reader.result);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tagsArray = product.tags.split(",").map((tag) => tag.trim());
    const newProduct = {
      ...product,
      price: parseFloat(product.price),
      discount: parseFloat(product.discount),
      tags: tagsArray,
      available: true,
    };
    await addDoc(collection(db, "products"), newProduct);
    onAdd && onAdd();
    setProduct({ name: "", price: "", discount: "", description: "", tags: "", image: "" });
    setPreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <label><strong>Nombre del producto</strong></label>
      <input name="name" value={product.name} onChange={handleChange} required />

      <label><strong>Precio</strong></label>
      <input name="price" value={product.price} onChange={handleChange} required type="number" />

      <label><strong>Descuento (%)</strong></label>
      <input name="discount" value={product.discount} onChange={handleChange} type="number" />

      <label><strong>Descripción</strong></label>
      <textarea name="description" value={product.description} onChange={handleChange} rows={3} />

      <label><strong>Imagen principal</strong></label>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {preview && <img src={preview} alt="Preview" className="image-preview" />}

      <label><strong>Etiquetas</strong></label>
      <input name="tags" value={product.tags} onChange={handleChange} />

      <button type="submit">Guardar producto</button>
    </form>
  );
}

export default ProductForm;
