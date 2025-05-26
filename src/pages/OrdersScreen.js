// src/screens/OrdersScreen.js
import React from 'react';
import './OrdersScreen.css'; // Si necesitas CSS para esta pantalla

function OrdersScreen() {
  return (
    <div className="orders-screen">
      <h1>Gestión de Pedidos</h1>
      <p>Aquí se mostrará la lista de pedidos recibidos.</p>
      {/* Aquí iría la lógica para cargar y mostrar los pedidos de Firebase */}
    </div>
  );
}

export default OrdersScreen;