import React from "react";
import { Link } from "react-router-dom";

function NotAuthorized() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Acceso denegado</h1>
      <p style={styles.message}>No tienes permisos para ver esta sección.</p>
      <Link to="/login" style={styles.link}>
        Volver al login
      </Link>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "100px",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: "28px",
    color: "#e53935",
  },
  message: {
    fontSize: "16px",
    marginTop: "10px",
  },
  link: {
    marginTop: "20px",
    display: "inline-block",
    textDecoration: "none",
    color: "#2196f3",
  },
};

export default NotAuthorized;
