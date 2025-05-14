import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import "./ProductList.css";
import { MdDelete } from 'react-icons/md';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProducts(list);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este producto?");
    if (confirmDelete) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  const toggleAvailability = async (id, current) => {
    const newAvailability = !current; // Calcula el nuevo valor booleano

    // Determina el nuevo valor de la cadena de texto 'status'
    const newStatus = newAvailability ? "disponible" : "no disponible";

    try {
      // Actualiza AMBOS campos en Firestore
      await updateDoc(doc(db, "products", id), {
        available: newAvailability,
        status: newStatus
      });
      console.log("Disponibilidad y estado actualizados con éxito para el producto:", id);
      fetchProducts(); // Vuelve a obtener los datos después de actualizar
    } catch (error) {
      console.error("Error al cambiar la disponibilidad y estado:", error);
      alert("Hubo un error al actualizar la disponibilidad.");
    }
  };

  // Mantén fetchProducts en el useEffect para la carga inicial
  useEffect(() => {
    fetchProducts();
  }, []);

  // Podrías considerar volver a obtener los datos periódicamente o usar un listener en tiempo real
  // si varios usuarios pueden modificar los datos concurrentemente.

  const handleUpdate = async (product) => {
    const { id, ...rest } = product;
    try {
      await updateDoc(doc(db, "products", id), rest);
      fetchProducts();
      setSelected(null); // cerrar modal al guardar
    } catch (err) {
      console.error("Error al actualizar producto:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
                handleDelete(p.id);
              }}
              className="delete-btn"
            >
              <MdDelete size={30} color="red" />
            </button>
          </div>
        </div>
      ))}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-edit">
              <img
                src={selected.image}
                alt={selected.name}
                className="modal-image"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setSelected({ ...selected, image: reader.result });
                    };
                    reader.readAsDataURL(file);
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
            />
            <input
              value={selected.discount}
              onChange={(e) =>
                setSelected({ ...selected, discount: e.target.value })
              }
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
            <button onClick={() => setSelected(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
