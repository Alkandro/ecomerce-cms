// src/services/orderService.js
import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    serverTimestamp,
    query, // Necesario para consultas
    orderBy, // Necesario para ordenar resultados
    getDocs,
    where // Necesario para obtener múltiples documentos
  } from "firebase/firestore";
import { db } from "../firebase/config"; // Asegúrate de que esta ruta a tu configuración de Firebase es correcta

export const orderService = {
  /**
   * Crea un nuevo pedido en la colección 'orders'.
   * @param {object} orderData - Objeto con los datos del pedido (userId, items, address, etc.).
   * @returns {Promise<DocumentReference>} Una promesa que resuelve con la referencia al documento creado.
   */
  createOrder: async ({ userId, userName, userEmail, items, address, paymentMethod, totalAmount }) => {
    const dataToSave = {
      userId,
      userName: userName || null, // Guarda el nombre del usuario (puede ser nulo si no está disponible)
      userEmail: userEmail || null, // Guarda el email del usuario
      items,           // Array de { id, name, price, quantity, imageUrl }
      address,         // Objeto con los detalles de la dirección
      paymentMethod,   // Método de pago (ej. "Tarjeta ****1234")
      totalAmount,     // El total del pedido
      status: "pending", // Estado inicial del pedido
      createdAt: serverTimestamp(), // Timestamp del servidor para la creación
      acceptedAt: null, // Fecha de aceptación (inicialmente nulo)
      rejectedAt: null, // Fecha de rechazo (inicialmente nulo)
      notes: "" // Campo para notas adicionales
    };
    try {
      const docRef = await addDoc(collection(db, "orders"), dataToSave);
      console.log("Pedido creado con ID: ", docRef.id);
      return docRef;
    } catch (error) {
      console.error("Error al crear el pedido: ", error);
      throw error; // Propaga el error para que la UI pueda manejarlo
    }
  },

  /**
   * Actualiza el estado de un pedido existente.
   * @param {string} orderId - El ID del pedido a actualizar.
   * @param {string} newStatus - El nuevo estado del pedido (ej. "accepted", "shipped").
   */
  updateOrderStatus: async (orderId, newStatus) => {
    const orderRef = doc(db, "orders", orderId);
    const updateData = { status: newStatus };

    if (newStatus === 'accepted') {
      updateData.acceptedAt = serverTimestamp();
    } else if (newStatus === 'rejected') {
      updateData.rejectedAt = serverTimestamp();
    }
    // Puedes añadir más lógica para otros estados si es necesario

    try {
      await updateDoc(orderRef, updateData);
      console.log(`Estado del pedido ${orderId} actualizado a ${newStatus}`);
    } catch (error) {
      console.error(`Error al actualizar el estado del pedido ${orderId}: `, error);
      throw error;
    }
  },

  /**
   * Obtiene todos los pedidos, ordenados por fecha de creación descendente.
   * Útil para la vista de administrador/CMS.
   * @returns {Promise<Array<object>>} Una promesa que resuelve con un array de objetos de pedidos.
   */
  getAllOrders: async () => {
    try {
      // Crea una consulta a la colección 'orders' y la ordena por 'createdAt' de forma descendente
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      // Mapea los documentos para incluir el ID del documento en el objeto
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return ordersList;
    } catch (error) {
      console.error("Error al obtener todos los pedidos: ", error);
      throw error;
    }
  },

  /**
   * Obtiene los pedidos de un usuario específico, ordenados por fecha de creación descendente.
   * Útil para la vista del usuario final.
   * @param {string} userId - El ID del usuario.
   * @returns {Promise<Array<object>>} Una promesa que resuelve con un array de objetos de pedidos.
   */
  getUserOrders: async (userId) => {
    try {
      const q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const userOrdersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return userOrdersList;
    } catch (error) {
      console.error(`Error al obtener los pedidos del usuario ${userId}: `, error);
      throw error;
    }
  }
};