// import React, { useState, useEffect } from "react";
// import { collection, addDoc } from "firebase/firestore";
// import { db } from "../firebase/config";
// import "./ProductForm.css";
// import { auth } from '../firebase/config';

// function ProductForm({ onAdd }) {

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(user => {
//         if (user) {
//             console.log("ProductForm: Usuario autenticado con UID:", user.uid);
//         } else {
//             console.log("ProductForm: USUARIO NO AUTENTICADO.");
//         }
//     });
//     return () => unsubscribe();
// }, []);

//   const [product, setProduct] = useState({
//     name: "",
//     price: "",
//     discount: "",
//     description: "",
//     tags: "",
//     image: "",
//   });
//   const [preview, setPreview] = useState(null);

  
//   const handleChange = (e) => {
//     setProduct({ ...product, [e.target.name]: e.target.value });
//   };

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setProduct({ ...product, image: reader.result });
//       setPreview(reader.result);
//     };
//     if (file) reader.readAsDataURL(file);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const tagsArray = product.tags.split(",").map((tag) => tag.trim());
//     const newProduct = {
//       ...product,
//       price: parseFloat(product.price),
//       discount: parseFloat(product.discount),
//       tags: tagsArray,
//       available: true,
//     };
//     await addDoc(collection(db, "products"), newProduct);
//     onAdd && onAdd();
//     setProduct({ name: "", price: "", discount: "", description: "", tags: "", image: "" });
//     setPreview(null);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="product-form">
//       <label><strong>Nombre del producto</strong></label>
//       <input name="name" value={product.name} onChange={handleChange} required />

//       <label><strong>Precio</strong></label>
//       <input name="price" value={product.price} onChange={handleChange} required type="number" />

//       <label><strong>Descuento (%)</strong></label>
//       <input name="discount" value={product.discount} onChange={handleChange} type="number" />

//       <label><strong>Descripción</strong></label>
//       <textarea name="description" value={product.description} onChange={handleChange} rows={3} />

//       <label><strong>Imagen principal</strong></label>
//       <input type="file" accept="image/*" onChange={handleImageUpload} />
//       {preview && <img src={preview} alt="Preview" className="image-preview" />}

//       <label><strong>Etiquetas</strong></label>
//       <input name="tags" value={product.tags} onChange={handleChange} />

//       <button type="submit">Guardar producto</button>
//     </form>
//   );
// }

// export default ProductForm;
import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importar de storage
import { db, auth, storage } from "../firebase/config"; // Importar storage
import "./ProductForm.css";

function ProductForm({ onAdd }) {
  // Monitorear estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log("ProductForm: Usuario autenticado con UID:", user.uid);
      } else {
        console.log("ProductForm: USUARIO NO AUTENTICADO.");
      }
    });
    return () => unsubscribe();
  }, []);

  // Estado para el formulario
  const [product, setProduct] = useState({
    name: "",
    price: "",
    discount: "",
    description: "",
    tags: "",
  });
  
  const [selectedFile, setSelectedFile] = useState(null); // Para guardar el objeto File
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  // Manejar carga de imagen
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file); // Guardar el archivo para subirlo después
    
    // Generar vista previa
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Debes estar autenticado para agregar productos");
        setLoading(false);
        return;
      }

      if (!selectedFile) { // Asegurarse de que se haya seleccionado una imagen
        setError("Por favor, selecciona una imagen para el producto.");
        setLoading(false);
        return;
      }
      
      // 1. Subir imagen a Cloud Storage
      const storageRef = ref(storage, `product_images/${user.uid}/${Date.now()}_${selectedFile.name}`);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const imageUrl = await getDownloadURL(uploadResult.ref); // Obtener la URL de la imagen subida
      
      // 2. Preparar datos del producto para Firestore (con la URL de la imagen)
      const tagsArray = product.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(tag => tag !== "");
        
      const newProduct = {
        name: product.name,
        price: parseFloat(product.price) || 0,
        discount: parseFloat(product.discount) || 0,
        description: product.description,
        tags: tagsArray,
        image: imageUrl, // <-- ¡Aquí guardamos la URL, no el Base64!
        available: true,
        createdBy: user.uid,
        createdAt: new Date()
      };
      
      // 3. Guardar en Firestore
      await addDoc(collection(db, "products"), newProduct);
      
      // Resetear formulario
      setProduct({ 
        name: "", 
        price: "", 
        discount: "", 
        description: "", 
        tags: "" 
      });
      setSelectedFile(null); // Resetear el archivo seleccionado
      setPreview(null);
      
      if (onAdd) onAdd();
      
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError("Error al guardar el producto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2 className="form-title">Agregar nuevo producto</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label><strong>Nombre del producto</strong></label>
        <input 
          name="name" 
          value={product.name} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="form-group">
        <label><strong>Precio</strong></label>
        <input 
          name="price" 
          value={product.price} 
          onChange={handleChange} 
          required 
          type="number" 
          min="0" 
          step="0.01" 
        />
      </div>

      <div className="form-group">
        <label><strong>Descuento (%)</strong></label>
        <input 
          name="discount" 
          value={product.discount} 
          onChange={handleChange} 
          type="number" 
          min="0" 
          max="100" 
        />
      </div>

      <div className="form-group">
        <label><strong>Descripción</strong></label>
        <textarea 
          name="description" 
          value={product.description} 
          onChange={handleChange} 
          rows={3} 
        />
      </div>

      <div className="form-group">
        <label><strong>Imagen principal</strong></label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
        />
        {preview && (
          <img 
            src={preview} 
            alt="Vista previa" 
            className="image-preview" 
          />
        )}
      </div>

      <div className="form-group">
        <label><strong>Etiquetas</strong> (separadas por comas)</label>
        <input 
          name="tags" 
          value={product.tags} 
          onChange={handleChange} 
          placeholder="ej: electrónica, smartphone, nuevo" 
        />
      </div>

      <button 
        type="submit" 
        className="submit-btn" 
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar producto"}
      </button>
    </form>
  );
}

export default ProductForm;