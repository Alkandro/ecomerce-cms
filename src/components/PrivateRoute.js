// src/components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/login" />;
  if (user.email !== "ale@a.com") return <Navigate to="/not-authorized" />;

  return children;
};

export default PrivateRoute;
