// src/components/TermsConditionsScreen.js
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar'; // Asegúrate de que la ruta a Sidebar sea correcta
import { termsConditionsService } from '../pages/termsConditionsService'; // Crearemos este servicio en el siguiente paso
import '../Styles/TermsConditionsScreen.css'; // Crearemos este CSS también

function TermsConditionsScreen() {
  const [termsContent, setTermsContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // Para mensajes de éxito/error

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const content = await termsConditionsService.getTermsAndConditions();
        setTermsContent(content || ''); // Si no hay contenido, inicializa como cadena vacía
        setError(null);
      } catch (err) {
        console.error("Error al cargar los términos y condiciones:", err);
        setError("No se pudieron cargar los términos y condiciones. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const handleSave = async () => {
    if (saving) return; // Evitar múltiples clics
    setSaving(true);
    setMessage('');
    setError(null);

    try {
      await termsConditionsService.updateTermsAndConditions(termsContent);
      setMessage("Términos y Condiciones actualizados exitosamente.");
    } catch (err) {
      console.error("Error al guardar los términos y condiciones:", err);
      setError("Error al guardar los términos y condiciones. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="terms-conditions-container">
        <h1>Gestionar Términos y Condiciones</h1>
        <p className="description">
          Edita el contenido de los Términos y Condiciones que los usuarios deberán aceptar.
        </p>

        {loading && <p>Cargando términos y condiciones...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {!loading && !error && (
          <div className="terms-editor">
            <textarea
              className="terms-textarea"
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              placeholder="Escribe aquí tus términos y condiciones..."
              rows={20} // Ajusta el número de filas según sea necesario
            />
            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Actualizar Términos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TermsConditionsScreen;