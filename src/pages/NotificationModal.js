import React, { useState } from "react";
import "./NotificationModal.css"; // Estilos para el modal

function NotificationModal({ isOpen, onClose, onSend, userName }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage(""); // Limpiar el mensaje después de enviar
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Enviar Notificación a {userName}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="notificationMessage">Mensaje:</label>
            <textarea
              id="notificationMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows="5"
              required
            ></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn btn-send">
              Enviar Mensaje
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NotificationModal;