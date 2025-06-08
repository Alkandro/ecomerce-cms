import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // Para obtener el ID del usuario de la URL
import MainLayout from "../layouts/MainLayout";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "../Styles/UserDetail.css"; // Estilos para la página de detalles
import NotificationModal from "./NotificationModal"; // Modal para notificaciones

function UserDetail() {
  const { userId } = useParams(); // Obtiene el userId de la URL
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el modal de notificación

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        // 1. Obtener datos del usuario
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setError("Usuario no encontrado.");
          setLoading(false);
          return;
        }

        const userData = { id: userDocSnap.id, ...userDocSnap.data() };
        setUser(userData);

        // 2. Obtener direcciones del usuario (ya las tenías, pero aquí las consultamos de nuevo para el detalle)
        const addressesRef = collection(db, "userAddresses");
        const qAddresses = query(addressesRef, where("userId", "==", userId));
        const addressesSnapshot = await getDocs(qAddresses);
        userData.addresses = addressesSnapshot.docs.map((addrDoc) => addrDoc.data());

        // 3. Obtener pedidos del usuario
        const ordersRef = collection(db, "orders");
        const qOrders = query(ordersRef, where("userId", "==", userId));
        const ordersSnapshot = await getDocs(qOrders);
        const fetchedOrders = ordersSnapshot.docs.map((orderDoc) => ({
          id: orderDoc.id,
          ...orderDoc.data(),
        }));
        setOrders(fetchedOrders);

        // 4. Obtener wishlist del usuario
        // Asumiendo que 'wishlist' es una subcolección dentro de 'users'
        const wishlistRef = collection(db, "users", userId, "wishlist");
        const wishlistSnapshot = await getDocs(wishlistRef);
        const likedProductIds = wishlistSnapshot.docs.map((wishDoc) => wishDoc.data().productId || wishDoc.id); // Asume que el ID del documento es el ID del producto si no hay campo productId

        const fetchedWishlist = await Promise.all(
          likedProductIds.map(async (productId) => {
            const productDoc = await getDoc(doc(db, "products", productId));
            return productDoc.exists() ? { id: productDoc.id, ...productDoc.data() } : null;
          })
        );
        // Filtra los productos que no se encontraron
        setWishlist(fetchedWishlist.filter(product => product !== null));

      } catch (err) {
        console.error("Error al cargar los detalles del usuario:", err);
        setError("Error al cargar los detalles del usuario. Revisa la consola para más detalles.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const isOnline = (updatedAt) => {
    if (!updatedAt) return "Desconocido";
    const lastSeenDate = updatedAt.toDate ? updatedAt.toDate() : new Date(updatedAt);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    return (now.getTime() - lastSeenDate.getTime()) < fiveMinutes ? "En línea" : "Desconectado";
  };

  const handleSendMessage = async (message) => {
    if (!user || !user.id) {
      console.error("Error: No se pudo obtener el ID del usuario para enviar la notificación.");
      alert("Error al enviar la notificación: ID de usuario no disponible.");
      return;
    }

    try {
      // Asume que tienes el ID del usuario actual del CMS (ej. del usuario autenticado)
      // Por ahora, usaremos un valor hardcodeado o puedes obtenerlo de tu contexto de autenticación
      const adminUserId = "YOUR_ADMIN_USER_ID"; // **Cámbiame**: Obtén el ID real del admin autenticado
      const adminUserName = "Administrador CMS"; // **Cámbiame**: Obtén el nombre real del admin

      await addDoc(collection(db, "notifications"), {
        userId: user.id, // ID del usuario al que se le envía la notificación
        message: message,
        timestamp: new Date(), // Marca de tiempo actual
        read: false, // Por defecto, la notificación no ha sido leída
        senderId: adminUserId,
        senderName: adminUserName,
      });

      alert(`Notificación enviada a ${user.email} y guardada en Firestore.`);
      setIsModalOpen(false); // Cierra el modal después de enviar

    } catch (error) {
      console.error("Error al enviar la notificación a Firestore:", error);
      alert("Hubo un error al intentar enviar la notificación.");
    }
  };


  if (loading) {
    return (
      <MainLayout>
        <h2 className="user-detail-loading-error">Cargando detalles del usuario...</h2>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <h2 className="user-detail-loading-error user-detail-error">Error: {error}</h2>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <h2 className="user-detail-loading-error">Usuario no encontrado.</h2>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="user-detail-container">
        <div className="user-detail-header">
          <img src={user.photoURL || "placeholder-user.png"} alt={user.displayName || "Usuario"} className="user-avatar" />
          <div>
            <h2 className="user-name">{user.firstName || ""} {user.lastName || "N/A"}</h2>
            <p className="user-nickname">@{user.nickname || user.displayName || "N/A"}</p>
            <p className={`user-status ${isOnline(user.updatedAt) === "En línea" ? "online" : "offline"}`}>
              {isOnline(user.updatedAt)}
            </p>
          </div>
          <button className="send-notification-btn" onClick={() => setIsModalOpen(true)}>
            Enviar Notificación
          </button>
        </div>

        <div className="user-detail-section">
          <h3>Información de Contacto</h3>
          <p><strong>Email:</strong> {user.email || "N/A"}</p>
          <p><strong>Teléfono:</strong> {user.phoneNumber || "N/A"}</p>
          <p><strong>Género:</strong> {user.gender || "N/A"}</p>
          <p><strong>Fecha de Nacimiento:</strong> {user.birthDate ? user.birthDate.toDate().toLocaleDateString() : "N/A"}</p>
          <p><strong>Rol:</strong> {user.role || "N/A"}</p>
          <p><strong>Miembro desde:</strong> {user.createdAt ? user.createdAt.toDate().toLocaleDateString() : "N/A"}</p>
        </div>

        <div className="user-detail-section">
          <h3>Direcciones</h3>
          {user.addresses && user.addresses.length > 0 ? (
            <div className="addresses-grid">
              {user.addresses.map((addr, index) => (
                <div key={index} className="address-card">
                  <h4>{addr.alias || "Dirección sin nombre"}</h4>
                  <p>{addr.street || "N/A"}, {addr.apartment ? addr.apartment + ", " : ""} {addr.city || "N/A"}</p>
                  <p>{addr.state || "N/A"}, {addr.zipCode || "N/A"}, {addr.country || "N/A"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No tiene direcciones guardadas.</p>
          )}
        </div>

        <div className="user-detail-section">
          <h3>Pedidos Realizados ({orders.length})</h3>
          {orders.length > 0 ? (
            <div className="orders-grid">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <h4>Pedido #{order.id.substring(0, 8)}</h4>
                  <p><strong>Fecha:</strong> {order.createdAt ? order.createdAt.toDate().toLocaleDateString() : "N/A"}</p>
                  <p><strong>Total:</strong> ${order.totalAmount ? order.totalAmount.toFixed(2) : "0.00"}</p>
                  <p><strong>Estado:</strong> <span className={`order-status-${order.status ? order.status.toLowerCase().replace(/\s/g, '-') : 'desconocido'}`}>{order.status || "N/A"}</span></p>
                  <div className="order-items">
                    <strong>Productos:</strong>
                    <ul>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} x {item.quantity} (${(item.price * item.quantity).toFixed(2)})
                          </li>
                        ))
                      ) : (
                        <li>No hay productos en este pedido.</li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No ha realizado pedidos.</p>
          )}
        </div>

        <div className="user-detail-section">
          <h3>Productos en Wishlist ({wishlist.length})</h3>
          {wishlist.length > 0 ? (
            <div className="wishlist-grid">
              {wishlist.map((product) => (
                <div key={product.id} className="wishlist-item-card">
                  <img src={product.image || "placeholder-product.png"} alt={product.name} className="wishlist-item-image" />
                  <p className="wishlist-item-name">{product.name || "N/A"}</p>
                  <p className="wishlist-item-price">${product.price ? product.price.toFixed(2) : "0.00"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No tiene productos en su wishlist.</p>
          )}
        </div>
      </div>

      <NotificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={handleSendMessage}
        userName={user.firstName || user.email}
      />
    </MainLayout>
  );
}

export default UserDetail;