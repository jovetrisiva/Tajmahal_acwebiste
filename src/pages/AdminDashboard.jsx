import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";

const STATUS_COLORS = {
  pending:   { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  confirmed: { bg: "rgba(34,197,94,0.15)",   color: "#22c55e" },
  completed: { bg: "rgba(56,189,248,0.15)",  color: "#38bdf8" },
  cancelled: { bg: "rgba(239,68,68,0.15)",   color: "#ef4444" },
};

export default function AdminDashboard() {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilter]   = useState("all");
  const [search, setSearch]         = useState("");
  const navigate                    = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("admin_auth")) {
      navigate("/admin");
      return;
    }
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res  = await fetch("https://tajmahal-acwebiste-5.onrender.com/api/bookings");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`https://tajmahal-acwebiste-5.onrender.com/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await fetch(`https://tajmahal-acwebiste-5.onrender.com/api/bookings/${id}`, {
        method: "DELETE",
      });
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    navigate("/admin");
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search);
    return matchStatus && matchSearch;
  });

  const counts = {
    all:       bookings.length,
    pending:   bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo">🛠️</span>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Tajmahal AC Service</p>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {Object.entries(counts).map(([key, val]) => (
          <div
            key={key}
            className={`stat-card ${filterStatus === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            <span className="stat-count">{val}</span>
            <span className="stat-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="🔍 Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">No bookings found.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Service</th>
                <th>Brand</th>
                <th>Date</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.name}</td>
                  <td>
                    <a href={`tel:${b.phone}`} className="admin-phone">
                      {b.phone}
                    </a>
                  </td>
                  <td>{b.email || "—"}</td>
                  <td>{b.service}</td>
                  <td>{b.acBrand || "—"}</td>
                  <td>{b.date}</td>
                  <td className="admin-msg">{b.message || "—"}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={STATUS_COLORS[b.status]}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        className="delete-btn"
                        onClick={() => deleteBooking(b.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}