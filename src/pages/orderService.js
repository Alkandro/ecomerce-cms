import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const orderService = {
  createOrder: async ({
    userId,
    userName,
    userEmail,
    items,
    address,
    paymentMethod,
    totalAmount,
    status,
    paymentIntentId,
  }) => {
    const dataToSave = {
      userId,
      userName: userName || null,
      userEmail: userEmail || null,
      items,
      address,
      paymentMethod,
      totalAmount,
      status: status || "pending",
      paymentIntentId: paymentIntentId || null,
      createdAt: serverTimestamp(),
      acceptedAt: null,
      rejectedAt: null,
      notes: "",
    };
    try {
      const docRef = await addDoc(collection(db, "orders"), dataToSave);
      console.log("Pedido creado con ID:", docRef.id);
      return docRef;
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    const orderRef = doc(db, "orders", orderId);
    const updateData = { status: newStatus };
    if (newStatus === "accepted") updateData.acceptedAt = serverTimestamp();
    else if (newStatus === "rejected")
      updateData.rejectedAt = serverTimestamp();
    try {
      await updateDoc(orderRef, updateData);
      console.log(`Pedido ${orderId} actualizado a "${newStatus}"`);
    } catch (error) {
      console.error(`Error al actualizar pedido ${orderId}:`, error);
      throw error;
    }
  },

  // ✅ NUEVO
  deleteOrder: async (orderId) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      console.log(`Pedido ${orderId} eliminado.`);
    } catch (error) {
      console.error(`Error al eliminar pedido ${orderId}:`, error);
      throw error;
    }
  },

  getAllOrders: async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      throw error;
    }
  },

  getUserOrders: async (userId) => {
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error(`Error al obtener pedidos del usuario ${userId}:`, error);
      throw error;
    }
  },
};
