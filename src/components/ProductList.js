import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // Importar de storage
import { db, auth, storage } from "../firebase/config"; // Importar storage
import "./ProductList.css";
import { MdDelete } from 'react-icons/md';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedFileForEdit, setSelectedFileForEdit] = useState(null); // Para el archivo de edición

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProducts(list);
  };

  const handleDelete = async (id, imageUrl) => { // Recibe la URL de la imagen para borrarla de Storage
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este producto?");
    if (confirmDelete) {
      try {
        // Opcional: Eliminar la imagen de Storage
        if (imageUrl && (imageUrl.startsWith("gs://") || imageUrl.startsWith("http"))) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef).catch(error => {
            // Ignorar errores si el archivo no existe (ya fue borrado, etc.)
            console.warn("Error al borrar imagen de Storage (puede que no exista):", error);
          });
        }
        
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        alert("Hubo un error al eliminar el producto: " + error.message);
      }
    }
  };

  const toggleAvailability = async (id, current) => {
    const newAvailability = !current; 
    const newStatus = newAvailability ? "disponible" : "no disponible";

    try {
      await updateDoc(doc(db, "products", id), {
        available: newAvailability,
        status: newStatus
      });
      console.log("Disponibilidad y estado actualizados con éxito para el producto:", id);
      fetchProducts(); 
    } catch (error) {
      console.error("Error al cambiar la disponibilidad y estado:", error);
      alert("Hubo un error al actualizar la disponibilidad.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdate = async (product) => {
    const { id, ...rest } = product;
    try {
      let updatedImageUrl = rest.image; // Mantener la imagen actual por defecto

      // Si se seleccionó un nuevo archivo para editar
      if (selectedFileForEdit) {
        // Opcional: Borrar la imagen antigua de Storage si existe
        if (product.image && (product.image.startsWith("gs://") || product.image.startsWith("http"))) {
            const oldImageRef = ref(storage, product.image);
            await deleteObject(oldImageRef).catch(error => {
                console.warn("Error al borrar imagen antigua de Storage (puede que no exista):", error);
            });
        }

        // Subir la nueva imagen a Cloud Storage
        const user = auth.currentUser;
        if (!user) {
            alert("Debes estar autenticado para actualizar la imagen.");
            return;
        }
        const storageRef = ref(storage, `product_images/${user.uid}/${Date.now()}_${selectedFileForEdit.name}`);
        const uploadResult = await uploadBytes(storageRef, selectedFileForEdit);
        updatedImageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Prepara los datos para la actualización
      const dataToUpdate = {
        ...rest,
        price: parseFloat(rest.price) || 0,
        discount: parseFloat(rest.discount) || 0,
        image: updatedImageUrl, // Usa la nueva URL si se subió, o la existente
        tags: Array.isArray(rest.tags) ? rest.tags : rest.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== "")
      };

      await updateDoc(doc(db, "products", id), dataToUpdate);
      fetchProducts();
      setSelected(null); // cerrar modal al guardar
      setSelectedFileForEdit(null); // Limpiar el archivo de edición
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      alert("Hubo un error al actualizar el producto: " + err.message);
    }
  };


  return (
    <div className="product-grid">
      {products.map((p) => (
        <div key={p.id} className="product-card" onClick={() => setSelected(p)}>
          <img src={p.image} alt={p.name} className="card-image" />
          <h4>{p.name}</h4>
          <p>
            ${p.price} - {p.discount}%
          </p>

          <div className="card-footer">
            <span
              className={`availability-badge ${
                p.available ? "available" : "unavailable"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleAvailability(p.id, p.available);
              }}
            >
              {p.available ? "Disponible" : "No disponible"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(p.id, p.image); // Pasar la URL de la imagen al borrar
              }}
              className="delete-btn"
            >
              <MdDelete size={30} color="red" />
            </button>
          </div>
        </div>
      ))}

      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setSelectedFileForEdit(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-edit">
              <img
                src={selectedFileForEdit ? URL.createObjectURL(selectedFileForEdit) : selected.image} // Mostrar la nueva previa o la existente
                alt={selected.name}
                className="modal-image"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedFileForEdit(file); // Guardar el objeto File para la subida
                  }
                }}
              />
            </div>

            <input
              value={selected.name}
              onChange={(e) =>
                setSelected({ ...selected, name: e.target.value })
              }
            />
            <input
              value={selected.price}
              onChange={(e) =>
                setSelected({ ...selected, price: e.target.value })
              }
              type="number" // Asegurar que sea tipo número
              step="0.01"
            />
            <input
              value={selected.discount}
              onChange={(e) =>
                setSelected({ ...selected, discount: e.target.value })
              }
              type="number" // Asegurar que sea tipo número
              min="0"
              max="100"
            />
            <textarea
              value={selected.description}
              onChange={(e) =>
                setSelected({ ...selected, description: e.target.value })
              }
            />
            <select
              value={selected.available ? "true" : "false"}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  available: e.target.value === "true",
                })
              }
            >
              <option value="true">Disponible</option>
              <option value="false">No disponible</option>
            </select>
            <button onClick={() => handleUpdate(selected)}>Guardar</button>
            <button onClick={() => { setSelected(null); setSelectedFileForEdit(null); }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;