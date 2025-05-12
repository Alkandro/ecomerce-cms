// src/pages/ChangePassword.js
import React, { useState } from "react";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./ChangePassword.css";

function ChangePassword() {
  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    const user = auth.currentUser;

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      setStep(2); // Mostrar campos de nueva contraseña
    } catch (err) {
      setError("Contraseña actual incorrecta.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
      setSuccess("Contraseña actualizada correctamente.");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError("Error al actualizar contraseña: " + err.message);
    }
  };

  return (
    <div className="change-password-container">
      <form
        onSubmit={step === 1 ? handleVerify : handleUpdate}
        className="change-password-form dark"
      >
        <h2>Cambiar Contraseña</h2>

        {step === 1 && (
          <>
            <input
              type="password"
              placeholder="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button type="submit">Verificar</button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Repetir contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button type="submit">Actualizar contraseña</button>
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        <button
          type="button"
          onClick={() => navigate("/products")}
          style={{ marginTop: "10px", backgroundColor: "#555" }}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;

