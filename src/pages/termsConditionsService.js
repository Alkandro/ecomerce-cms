// src/services/termsConditionsService.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config"; // Asegúrate de que esta ruta sea correcta

const TERMS_DOC_ID = "currentTerms"; // ID único del documento de términos y condiciones
const SETTINGS_COLLECTION = "appSettings"; // Colección donde se guardarán los términos

export const termsConditionsService = {
  /**
   * Obtiene el contenido actual de los Términos y Condiciones.
   * @returns {Promise<string|null>} El contenido de los términos o null si no existen.
   */
  getTermsAndConditions: async () => {
    try {
      const termsRef = doc(db, SETTINGS_COLLECTION, TERMS_DOC_ID);
      const docSnap = await getDoc(termsRef);

      if (docSnap.exists()) {
        return docSnap.data().content;
      } else {
        console.log("No se encontraron términos y condiciones en Firestore.");
        return null;
      }
    } catch (error) {
      console.error("Error al obtener los términos y condiciones:", error);
      throw error;
    }
  },

  /**
   * Actualiza el contenido de los Términos y Condiciones.
   * Si el documento no existe, lo crea.
   * @param {string} content - El nuevo contenido de los términos y condiciones.
   * @returns {Promise<void>}
   */
  updateTermsAndConditions: async (content) => {
    try {
      const termsRef = doc(db, SETTINGS_COLLECTION, TERMS_DOC_ID);
      await setDoc(termsRef, {
        content: content,
        lastUpdated: serverTimestamp(), // Registra la fecha de la última actualización
      }, { merge: true }); // Usar merge: true para no sobrescribir otros campos si los hubiera
      console.log("Términos y Condiciones actualizados exitosamente.");
    } catch (error) {
      console.error("Error al actualizar los términos y condiciones:", error);
      throw error;
    }
  },
};