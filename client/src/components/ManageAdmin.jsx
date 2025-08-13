import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../styles/global/MainStyles.css";
import AlertModal from "./AlertModal";

const ManageAdmin = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [admins, setAdmins] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [isMain, setIsMain] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");

  const [modalProps, setModalProps] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null
  });

  const showModal = ({ title, message, type = "info", onConfirm }) => {
    setModalProps({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onConfirm?.();
        setModalProps((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

    useEffect(() => {
  if (!token) return navigate("/login");

  try {
    const decoded = jwtDecode(token);
    setUserId(decoded.id);

    if (decoded.role !== "main") {
      showModal({
        title: "Access Denied",
        message: "Only the main admin can manage admins.",
        type: "error",
        onConfirm: () => navigate("/admin") // ✅ redirect after confirming modal
      });
      return;
    }

    setIsMain(true);
    fetchAdmins();
  } catch (err) {
    console.error("Invalid token");
    navigate("/login");
  }
}, [navigate]);


  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${baseUrl}/admins/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.data.filter((a) => a.role === "admin"));
      } else {
        showModal({ title: "Error", message: data.message || "Failed to load admins", type: "error" });
      }
    } catch (err) {
      showModal({ title: "Error", message: "Error loading admins", type: "error" });
    }
  };

  const addAdmin = async () => {
    if (!newUsername || !newEmail || !newPassword) {
      showModal({ title: "Missing Fields", message: "All fields are required.", type: "warning" });
      return;
    }

    setLoading(true);
    const res = await fetch(`${baseUrl}/admins/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: newUsername, email: newEmail, password: newPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      fetchAdmins();
    } else {
      showModal({ title: "Error", message: data.message || "Failed to add admin", type: "error" });
    }
  };

  const deleteAdmin = async (id) => {
    showModal({
      title: "Delete Admin?",
      message: "Are you sure you want to delete this admin?",
      type: "warning",
      onConfirm: async () => {
        const res = await fetch(`${baseUrl}/admins/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) fetchAdmins();
        else showModal({ title: "Error", message: data.message, type: "error" });
      }
    });
  };

  const transferRole = async (id) => {
    showModal({
      title: "Transfer Role?",
      message: "Transfer main admin role to this user?",
      type: "warning",
      onConfirm: async () => {
        const res = await fetch(`${baseUrl}/admins/transfer-role/${id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          showModal({
            title: "Success",
            message: "Role transferred. Please log in again.",
            type: "success",
            onConfirm: () => {
              localStorage.removeItem("jwtToken");
              navigate("/login");
            },
          });
        } else {
          showModal({ title: "Error", message: data.message, type: "error" });
        }
      }
    });
  };

  useEffect(() => {
    if (!token) return navigate("/login");

    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.id);

      if (decoded.role !== "main") {
        if (!sessionStorage.getItem("alertShown")) {
          showModal({
            title: "Access Denied",
            message: "Only the main admin can manage admins.",
            type: "error",
            onConfirm: () => navigate("/admin")
          });
          sessionStorage.setItem("alertShown", "true");
        }
        return;
      }

      setIsMain(true);
      fetchAdmins();
    } catch (err) {
      console.error("Invalid token");
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="Background" className="background-image" />
      <div className="page-overlay"></div>
      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="Changi Experience Studio" />
      </div>

      <div className="manage-admin-wrapper">
        <h1 style={{ color: "#000", fontSize: "28px", textAlign: "center", marginBottom: "20px" }}>
          Manage Admins
        </h1>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <input type="text" placeholder="New admin username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="New admin email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
          <button className="login-btn" style={btnStyle("#28a745")} onClick={addAdmin} disabled={loading}>
            {loading ? "Adding..." : "Add Admin"}
          </button>
          <button className="login-btn" style={{ marginTop: "12px", ...btnStyle("#6c757d") }} onClick={() => navigate("/admin")}>← Back to Admin</button>
        </div>

        <div>
          <h3 style={{ color: "#000", textAlign: "center", marginBottom: "12px" }}>All Admins</h3>
          <ul style={{ padding: 0, listStyleType: "none", textAlign: "center" }}>
            {admins.map((admin) => (
              <li key={admin._id} style={{ marginBottom: "12px" }}>
                <strong>{admin.username}</strong>
                <div><strong>{admin.email}</strong></div>
                <button className="login-btn" style={btnStyle("#dc3545")} onClick={() => deleteAdmin(admin._id)}>Remove</button>
                <button className="login-btn" style={btnStyle("#007bff")} onClick={() => transferRole(admin._id)}>Transfer Role</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AlertModal
        isOpen={modalProps.isOpen}
        onClose={() => setModalProps((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalProps.onConfirm}
        title={modalProps.title}
        message={modalProps.message}
        type={modalProps.type}
      />
    </div>
  );
};

const inputStyle = {
  marginRight: "8px",
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const btnStyle = (bgColor) => ({
  marginLeft: "10px",
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: bgColor,
  color: "#fff",
  cursor: "pointer",
});

export default ManageAdmin;
