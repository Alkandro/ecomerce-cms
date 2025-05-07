import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Users from "./pages/Users";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import PrivateRoute from "./components/PrivateRoute";
import NotAuthorized from "./pages/NotAuthorized";
import "./App.css";

function App() {
  return (
    <Router>

      <Routes>
     
        <Route path="/login" element={<Login />} />
         <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }/>
        <Route path="/products"element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          }/>
        <Route path="/users"element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          } />
        <Route
          path="/change-password"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }/> 
          
      </Routes>
    </Router>
  );
}

export default App;
