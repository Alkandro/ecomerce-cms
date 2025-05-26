// src/pages/Orders.js
import React, { useEffect, useState, useCallback } from 'react'; // Importa useCallback
import { orderService } from '../pages/orderService';
import Sidebar from '../components/Sidebar';
import './Orders.css';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    // Función para cargar los pedidos (usamos useCallback para memorizarla)
    const fetchOrders = useCallback(async () => {
      try {
        setLoading(true);
        const fetchedOrders = await orderService.getAllOrders();
        setOrders(fetchedOrders);
        setError(null);
      } catch (err) {
        console.error("Error al cargar los pedidos:", err);
        setError("Error al cargar los pedidos. Inténtalo de nuevo más tarde.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }, []);
  
    // UseEffect para cargar los pedidos inicialmente
    useEffect(() => {
      fetchOrders();
    }, [fetchOrders]); // La dependencia [fetchOrders] asegura que se llama solo una vez
  
    // Handler para aceptar un pedido
    const handleAcceptOrder = async (orderId) => {
      try {
        await orderService.updateOrderStatus(orderId, 'accepted');
        // Actualiza el estado local inmediatamente para reflejar el cambio
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, status: 'accepted', acceptedAt: new Date() } // Usa new Date() para actualización inmediata
              : order
          )
        );
        console.log(`Pedido ${orderId} aceptado.`);
      } catch (err) {
        console.error("Error al aceptar el pedido:", err);
        alert("No se pudo aceptar el pedido. Inténtalo de nuevo.");
      }
    };
  
    // Handler para rechazar un pedido
    const handleRejectOrder = async (orderId) => {
      try {
        await orderService.updateOrderStatus(orderId, 'rejected');
        // Actualiza el estado local inmediatamente
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, status: 'rejected', rejectedAt: new Date() } // Usa new Date() para actualización inmediata
              : order
          )
        );
        console.log(`Pedido ${orderId} rechazado.`);
      } catch (err) {
        console.error("Error al rechazar el pedido:", err);
        alert("No se pudo rechazar el pedido. Inténtalo de nuevo.");
      }
    };
  
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div className="orders-container">
          <h1>Gestión de Pedidos</h1>
  
          {loading && <p>Cargando pedidos...</p>}
          {error && <p className="error-message">{error}</p>}
  
          {!loading && !error && orders.length === 0 && (
            <p>No hay pedidos para mostrar.</p>
          )}
  
          {!loading && !error && orders.length > 0 && (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-item">
                  <h3>Pedido #{order.id}</h3>
                  <p>Cliente: {order.userName || order.userEmail}</p>
                  <p>Total: {order.totalAmount ? `${order.totalAmount.toFixed(2)}€` : 'N/A'}</p>
                  <p>Estado: **{order.status}**</p>
                  <p>Fecha de creación: {order.createdAt?.toDate().toLocaleDateString() || 'N/A'}</p>
                  {/* Asegúrate de que order.acceptedAt y order.rejectedAt son objetos Date o Firebase Timestamps */}
                  {order.acceptedAt && <p>Fecha de aceptación: {order.acceptedAt instanceof Date ? order.acceptedAt.toLocaleDateString() : order.acceptedAt?.toDate().toLocaleDateString()}</p>}
                  {order.rejectedAt && <p>Fecha de rechazo: {order.rejectedAt instanceof Date ? order.rejectedAt.toLocaleDateString() : order.rejectedAt?.toDate().toLocaleDateString()}</p>}
  
                  <h4>Productos:</h4>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.name} ({item.quantity} x {item.price}€)
                      </li>
                    ))}
                  </ul>
                  <p>Dirección: {order.address?.street}, {order.address?.city}</p>
  
                  {order.status === 'pending' && (
                    <div className="order-actions">
                      <button onClick={() => handleAcceptOrder(order.id)}>Aceptar Pedido</button>
                      <button onClick={() => handleRejectOrder(order.id)} className="reject-button">Rechazar Pedido</button>
                    </div>
                  )}
                   {order.status !== 'pending' && (
                    <p className="order-status-message">Este pedido ya ha sido {order.status === 'accepted' ? 'aceptado' : 'rechazado'}.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  export default Orders;