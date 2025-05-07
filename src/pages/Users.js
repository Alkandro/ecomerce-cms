import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  return (
    <MainLayout>
      <h2>Usuarios</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px" }}>Nombre</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: "8px" }}>{user.name || "-"}</td>
              <td style={{ padding: "8px" }}>{user.email || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MainLayout>
  );
}

export default Users;
