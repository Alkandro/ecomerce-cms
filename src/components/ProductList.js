import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, auth, storage } from "../firebase/config";
import "./ProductList.css";
import { MdDelete } from "react-icons/md";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedFilesForEdit, setSelectedFilesForEdit] = useState([]);

  // 1) Traer todos los productos
  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    setProducts(list);
  };

  // 2) Borrar producto y todas sus imágenes
  const handleDelete = async (id, imagesArray) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?"
    );
    if (!confirmDelete) return;

    try {
      if (Array.isArray(imagesArray) && imagesArray.length > 0) {
        const deletePromises = imagesArray.map((url) => {
          if (
            typeof url === "string" &&
            (url.startsWith("gs://") || url.startsWith("http"))
          ) {
            const imageRef = ref(storage, url);
            return deleteObject(imageRef).catch((err) => {
              console.warn(
                "No se pudo borrar de Storage (quizá ya no existe):",
                err
              );
              return null;
            });
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
      }
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("Hubo un error al eliminar el producto: " + error.message);
    }
  };

  // 3) Alternar disponibilidad
  const toggleAvailability = async (id, current) => {
    const newAvailability = !current;
    const newStatus = newAvailability ? "disponible" : "no disponible";

    try {
      await updateDoc(doc(db, "products", id), {
        available: newAvailability,
        status: newStatus,
      });
      fetchProducts();
    } catch (error) {
      console.error("Error al cambiar disponibilidad:", error);
      alert("Hubo un error al actualizar la disponibilidad.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 4) Actualizar producto e imágenes
  const handleUpdate = async (product) => {
    const { id, images: oldImages = [], ...rest } = product;
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Debes estar autenticado para actualizar el producto.");
        return;
      }

      let updatedImageUrls = oldImages;

      if (
        Array.isArray(selectedFilesForEdit) &&
        selectedFilesForEdit.length > 0
      ) {
        // Borrar antiguas
        const deleteOld = oldImages.map((url) => {
          if (
            typeof url === "string" &&
            (url.startsWith("gs://") || url.startsWith("http"))
          ) {
            const oldRef = ref(storage, url);
            return deleteObject(oldRef).catch((e) => {
              console.warn("No se pudo borrar imagen antigua:", e);
              return null;
            });
          }
          return Promise.resolve();
        });
        await Promise.all(deleteOld);

        // Subir nuevas
        const uploadPromises = selectedFilesForEdit.map((file) => {
          const storageRef = ref(
            storage,
            `product_images/${user.uid}/${Date.now()}_${file.name}`
          );
          return uploadBytes(storageRef, file).then((res) =>
            getDownloadURL(res.ref)
          );
        });
        updatedImageUrls = await Promise.all(uploadPromises);
      }

      const tagsArray = Array.isArray(rest.tags)
        ? rest.tags
        : (typeof rest.tags === "string" ? rest.tags.split(",") : [])
            .map((t) => t.trim())
            .filter((t) => t !== "");

      const dataToUpdate = {
        name: rest.name,
        price: parseFloat(rest.price) || 0,
        discount: parseFloat(rest.discount) || 0,
        description: rest.description,
        tags: tagsArray,
        coverImage:
          updatedImageUrls.length > 0 ? updatedImageUrls[0] : "",
        images: updatedImageUrls,
        available: rest.available,
        status: rest.available ? "disponible" : "no disponible",
      };

      await updateDoc(doc(db, "products", id), dataToUpdate);
      fetchProducts();
      setSelected(null);
      setSelectedFilesForEdit([]);
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      alert("Hubo un error al actualizar el producto: " + err.message);
    }
  };

  return (
    <div className="product-grid">
      {products.map((p) => (
        <div
          key={p.id}
          className="product-card"
          onClick={() => setSelected(p)}
        >
          {/** 5.1) Mostrar la portada grande arriba */}
          <img src={p.coverImage} alt={p.name} className="card-image" />

          {/** 5.2) Miniaturas de todas las imágenes (excepto portada) abajo */}
          {Array.isArray(p.images) && p.images.length > 1 && (
            <div className="thumbnail-container">
              {p.images.slice(1).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${p.name} miniatura ${idx + 1}`}
                  className="thumbnail-image"
                />
              ))}
            </div>
          )}

          <h4 className="product-title">{p.name}</h4>
          <p className="product-price">
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
                handleDelete(p.id, p.images);
              }}
              className="delete-btn"
            >
              <MdDelete size={24} color="red" />
            </button>
          </div>
        </div>
      ))}

      {selected && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelected(null);
            setSelectedFilesForEdit([]);
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {Array.isArray(selected.images) &&
              selected.images.length > 0 && (
                <div className="edit-image-carousel">
                  {selected.images.map((url, idx) => (
                    <div key={idx} className="carousel-item-edit">
                      <img
                        src={url}
                        alt={`${selected.name} ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}

            <label>
              <strong>Cambiar imágenes (múltiple selección):</strong>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setSelectedFilesForEdit(files);
              }}
            />

            {selectedFilesForEdit.length > 0 && (
              <div className="edit-preview-container">
                {selectedFilesForEdit.map((file, i) => {
                  const objectUrl = URL.createObjectURL(file);
                  return (
                    <div key={i} className="preview-item">
                      <img
                        src={objectUrl}
                        alt={`Preview ${i + 1}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              value={selected.name}
              onChange={(e) =>
                setSelected({ ...selected, name: e.target.value })
              }
              placeholder="Nombre"
            />
            <input
              type="number"
              step="0.01"
              value={selected.price}
              onChange={(e) =>
                setSelected({ ...selected, price: e.target.value })
              }
              placeholder="Precio"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={selected.discount}
              onChange={(e) =>
                setSelected({ ...selected, discount: e.target.value })
              }
              placeholder="Descuento %"
            />
            <textarea
              rows="3"
              value={selected.description}
              onChange={(e) =>
                setSelected({ ...selected, description: e.target.value })
              }
              placeholder="Descripción"
            />
            <input
              type="text"
              value={
                Array.isArray(selected.tags)
                  ? selected.tags.join(", ")
                  : selected.tags || ""
              }
              onChange={(e) =>
                setSelected({ ...selected, tags: e.target.value })
              }
              placeholder="Etiquetas (separadas por comas)"
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

            <div className="modal-buttons">
              <button onClick={() => handleUpdate(selected)}>Guardar</button>
              <button
                onClick={() => {
                  setSelected(null);
                  setSelectedFilesForEdit([]);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
