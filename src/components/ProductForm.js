// // export default ProductForm;
import React, { useState,  } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase/config";
import "../Styles/ProductForm.css";

function ProductForm({ onAdd }) {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    discount: "",
    description: "",
    tags: "",
  });

  // Ahora soportamos varios archivos
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Función para manejar cambios en inputs de texto
  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  // Manejar selección de múltiples imágenes y generar sus vistas previas
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) {
      setSelectedFiles([]);
      setPreviews([]);
      return;
    }

    setSelectedFiles(files);

    // Generar previews
    const previewUrls = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previewUrls.push(reader.result);
        if (previewUrls.length === files.length) {
          setPreviews(previewUrls);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Envío del formulario: subir múltiples imágenes y guardar el producto
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Debes estar autenticado para agregar productos.");
        setLoading(false);
        return;
      }
      if (selectedFiles.length === 0) {
        setError("Por favor selecciona al menos una imagen.");
        setLoading(false);
        return;
      }

      // 1) Subir cada imagen al Storage y obtener URLs
      const uploadPromises = selectedFiles.map((file) => {
        const storageRef = ref(
          storage,
          `product_images/${user.uid}/${Date.now()}_${file.name}`
        );
        return uploadBytes(storageRef, file).then((res) =>
          getDownloadURL(res.ref)
        );
      });
      const imageUrls = await Promise.all(uploadPromises);

      // 2) La primera URL es portada
      const coverImage = imageUrls[0];

      // 3) Preparar tags
      const tagsArray = product.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      // 4) Construir objeto Producto
      const newProduct = {
        name: product.name,
        price: parseFloat(product.price) || 0,
        discount: parseFloat(product.discount) || 0,
        description: product.description,
        tags: tagsArray,
        coverImage,
        images: imageUrls,
        available: true,
        createdBy: user.uid,
        createdAt: new Date(),
      };

      // 5) Guardar en Firestore
      await addDoc(collection(db, "products"), newProduct);

      // Limpiar form
      setProduct({
        name: "",
        price: "",
        discount: "",
        description: "",
        tags: "",
      });
      setSelectedFiles([]);
      setPreviews([]);
      onAdd && onAdd();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2>Agregar nuevo producto</h2>
      {error && <div className="error">{error}</div>}

      <label>Nombre</label>
      <input
        name="name"
        value={product.name}
        onChange={handleChange}
        required
      />

      <label>Precio</label>
      <input
        name="price"
        type="number"
        step="0.01"
        value={product.price}
        onChange={handleChange}
        required
      />

      <label>Descuento (%)</label>
      <input
        name="discount"
        type="number"
        min="0"
        max="100"
        value={product.discount}
        onChange={handleChange}
      />

      <label>Descripción</label>
      <textarea
        name="description"
        rows="3"
        value={product.description}
        onChange={handleChange}
      />

      <label>Etiquetas (separadas por comas)</label>
      <input
        name="tags"
        value={product.tags}
        onChange={handleChange}
        placeholder="ej: electrónica, smartphone"
      />

      <label>Imágenes (la primera será portada)</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
      />

      {/* Mostrar vistas previas */}
      {previews.length > 0 && (
        <div className="preview-container">
          {previews.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Preview ${i + 1}`}
              className="preview-img"
            />
          ))}
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar producto"}
      </button>
    </form>
  );
}

export default ProductForm;
