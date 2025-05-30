import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom"; // Importa useNavigate para la navegación
import "./Users.css"; // Crearemos este CSS para el estilo de la tabla

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook para la navegación

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true);
        // Solo obtener la información básica de los usuarios para la tabla principal
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map((userDoc) => ({
          id: userDoc.id,
          ...userDoc.data(),
        }));
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
    const lastSeenDate = updatedAt.toDate ? updatedAt.toDate() : new Date(updatedAt);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos

    return (now.getTime() - lastSeenDate.getTime()) < fiveMinutes ? "En línea" : "Desconectado";
  };

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`); // Redirige a la página de detalles del usuario
  };

  if (loading) {
    return (
      <MainLayout>
        <h2 className="users-loading-error">Cargando Usuarios...</h2>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <h2 className="users-loading-error users-error">Error: {error}</h2>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <h2 className="users-title">Gestión de Usuarios</h2>
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} onClick={() => handleUserClick(user.id)} className="users-table-row">
                <td>{user.firstName || ""} {user.lastName || "N/A"}</td>
                <td>{user.email || "N/A"}</td>
                <td>{user.phoneNumber || "N/A"}</td>
                <td>{isOnline(user.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

export default Users;