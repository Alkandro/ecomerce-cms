import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore"; // Importa 'query' y 'where'
import { db } from "../firebase/config"; // Asegúrate de que tu configuración de Firebase es correcta

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true);
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = [];

        for (const userDoc of usersSnapshot.docs) {
          const userData = { id: userDoc.id, ...userDoc.data() };

          // --- 1. Obtener direcciones del usuario ---
          // Asumiendo que 'userAddresses' es una colección global y cada documento de dirección
          // tiene un campo 'userId' que coincide con el ID del usuario (userDoc.id).
          const addressesRef = collection(db, "userAddresses");
          const qAddresses = query(addressesRef, where("userId", "==", userDoc.id));
          const addressesSnapshot = await getDocs(qAddresses);

          const addresses = addressesSnapshot.docs.map((addrDoc) => addrDoc.data());
          userData.addresses = addresses;

          // --- 2. Obtener productos 'Me gusta' del usuario ---
          // Asumiendo que 'userLikes' es una colección global, y cada documento tiene 'userId' y 'productId'.
          const likesRef = collection(db, "userLikes");
          const qLikes = query(likesRef, where("userId", "==", userDoc.id));
          const likesSnapshot = await getDocs(qLikes);

          const likedProductIds = likesSnapshot.docs.map((likeDoc) => likeDoc.data().productId);

          // Obtener los detalles (nombre) de los productos a los que le dio "me gusta"
          const productNames = await Promise.all(
            likedProductIds.map(async (productId) => {
              const productDoc = await getDoc(doc(db, "products", productId));
              return productDoc.exists() ? productDoc.data().name : "Producto desconocido";
            })
          );
          userData.likedProducts = productNames;

          usersList.push(userData);
        }
        setUsers(usersList);
      } catch (err) {
        console.error("Error al cargar los datos de los usuarios:", err);
        setError("Error al cargar los datos de los usuarios. Revisa la consola para más detalles.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsersData();
  }, []);

  // Función para determinar el estado online/offline
  const isOnline = (updatedAt) => {
    if (!updatedAt) return "Desconocido";
    // Convertimos el Timestamp de Firebase a un objeto Date para la comparación.
    const lastSeenDate = updatedAt.toDate ? updatedAt.toDate() : new Date(updatedAt);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos

    return (now.getTime() - lastSeenDate.getTime()) < fiveMinutes ? "En línea" : "Desconectado";
  };

  if (loading) {
    return (
      <MainLayout>
        <h2 style={{ textAlign: "center", marginTop: "50px" }}>Cargando Usuarios...</h2>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <h2 style={{ textAlign: "center", color: "red", marginTop: "50px" }}>Error: {error}</h2>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <h2>Gestión de Usuarios</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre Completo</th>
              <th style={styles.th}>Nickname</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Teléfono</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Direcciones</th>
              <th style={styles.th}>Productos Favoritos</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={styles.tr}>
                <td style={styles.td}>
                  {user.firstName || "N/A"}{" "}
                  {user.lastName || ""}
                </td>
                <td style={styles.td}>{user.displayName || "N/A"}</td> {/* Usamos displayName como nickname */}
                <td style={styles.td}>{user.email || "N/A"}</td>
                <td style={styles.td}>{user.phoneNumber || "N/A"}</td>
                <td style={styles.td}>{isOnline(user.updatedAt)}</td> {/* Usamos updatedAt para el estado */}
                <td style={styles.td}>
                  {user.addresses && user.addresses.length > 0 ? (
                    <ul style={styles.ul}>
                      {user.addresses.map((addr, index) => (
                        <li key={index} style={styles.li}>
                          <strong>Alias:</strong> {addr.alias || "N/A"} <br />
                          {addr.street || "N/A"},{" "}
                          {addr.apartment ? addr.apartment + ", " : ""}{" "}
                          {addr.city || "N/A"}, {addr.state || "N/A"}{" "}
                          {addr.zipCode || "N/A"} <br />
                          {addr.country || "N/A"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No hay direcciones guardadas"
                  )}
                </td>
                <td style={styles.td}>
                  {user.likedProducts && user.likedProducts.length > 0 ? (
                    <ul style={styles.ul}>
                      {user.likedProducts.map((productName, index) => (
                        <li key={index} style={styles.li}>
                          {productName}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No tiene productos favoritos"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  th: {
    textAlign: "left",
    padding: "15px 12px",
    backgroundColor: "#f0f2f5",
    borderBottom: "1px solid #e0e0e0",
    fontWeight: "600",
    color: "#333",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f5f5f5",
    verticalAlign: "top",
    fontSize: "14px",
    color: "#555",
  },
  tr: {
    backgroundColor: "#fff",
    "&:nth-child(even)": {
      backgroundColor: "#f9f9f9", // Estilo para filas pares (opcional)
    },
  },
  ul: {
    margin: 0,
    paddingLeft: "20px",
    listStyleType: "disc",
  },
  li: {
    marginBottom: "5px",
  },
};

export default Users;