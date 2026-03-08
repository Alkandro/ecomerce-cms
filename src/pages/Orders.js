import React, { useEffect, useState, useCallback } from "react";
import { orderService } from "../pages/orderService";
import Sidebar from "../components/Sidebar";

// ─── Helper accesibilidad: envuelve todos los emojis correctamente ─────────
// Elimina todos los warnings jsx-a11y/accessible-emoji de una vez
function Emoji({ symbol, label }) {
  return (
    <span role="img" aria-label={label} style={{ marginRight: 4 }}>
      {symbol}
    </span>
  );
}

// ─── Configuración de estados ──────────────────────────────────────────────
const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "#f59e0b",
    bg: "#fef3c7",
    border: "#fcd34d",
    dot: "#d97706",
  },
  paid: {
    label: "Pago confirmado",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#93c5fd",
    dot: "#2563eb",
  },
  accepted: {
    label: "Aceptado",
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    dot: "#059669",
  },
  rejected: {
    label: "Rechazado",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fca5a5",
    dot: "#dc2626",
  },
  delivered: {
    label: "Entregado",
    color: "#6366f1",
    bg: "#eef2ff",
    border: "#a5b4fc",
    dot: "#4f46e5",
  },
};

// ─── Detectar si es contra entrega ────────────────────────────────────────
const isCashOnDelivery = (order) => {
  const method = String(
    order.paymentMethod || order.payment_method || order.payment || "",
  )
    .toLowerCase()
    .trim();
  return (
    method === "cod" ||
    method.includes("cash") ||
    method.includes("contra") ||
    method.includes("entrega") ||
    method.includes("efectivo") ||
    order.cashOnDelivery === true ||
    order.isCashOnDelivery === true
  );
};

// ─── Etiqueta del método de pago ──────────────────────────────────────────
const getPaymentLabel = (order) => {
  if (isCashOnDelivery(order))
    return {
      symbol: "💵",
      ariaLabel: "billete",
      label: "Contra entrega",
      color: "#854d0e",
      bg: "#fefce8",
      border: "#fde68a",
    };
  const raw = (
    order.paymentMethod ||
    order.payment_method ||
    order.payment ||
    ""
  ).toLowerCase();
  if (raw.includes("stripe") || raw.includes("card") || raw.includes("tarjeta"))
    return {
      symbol: "💳",
      ariaLabel: "tarjeta de crédito",
      label: "Tarjeta",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#93c5fd",
    };
  if (raw.includes("transfer"))
    return {
      symbol: "🏦",
      ariaLabel: "banco",
      label: "Transferencia",
      color: "#6d28d9",
      bg: "#f5f3ff",
      border: "#c4b5fd",
    };
  const display =
    order.paymentMethod || order.payment_method || order.payment || "—";
  return {
    symbol: "💰",
    ariaLabel: "dinero",
    label: display,
    color: "#475569",
    bg: "#f8fafc",
    border: "#e2e8f0",
  };
};

function formatDate(dateValue) {
  if (!dateValue) return null;
  const d = dateValue instanceof Date ? dateValue : dateValue?.toDate?.();
  if (!d) return null;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Badge de método de pago ───────────────────────────────────────────────
function PaymentBadge({ order }) {
  const { symbol, ariaLabel, label, color, bg, border } =
    getPaymentLabel(order);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: bg,
        color,
        border: `1px solid ${border}`,
        letterSpacing: "0.01em",
      }}
    >
      <Emoji symbol={symbol} label={ariaLabel} />
      {label}
    </span>
  );
}

// ─── Badge de estado ───────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ─── Timeline de historial ─────────────────────────────────────────────────
function Timeline({ order }) {
  const events = [];

  if (order.createdAt)
    events.push({
      symbol: "📋",
      ariaLabel: "portapapeles",
      label: "Pedido recibido",
      date: formatDate(order.createdAt),
      color: "#64748b",
    });

  if (isCashOnDelivery(order)) {
    if (order.status === "accepted" || order.acceptedAt)
      events.push({
        symbol: "✅",
        ariaLabel: "check",
        label: "Pedido aceptado — cobro al entregar",
        date: formatDate(order.acceptedAt),
        color: "#10b981",
      });
    if (order.deliveredAt)
      events.push({
        symbol: "🏠",
        ariaLabel: "casa",
        label: "Entregado y cobrado",
        date: formatDate(order.deliveredAt),
        color: "#6366f1",
      });
  } else {
    if (order.paidAt)
      events.push({
        symbol: "💳",
        ariaLabel: "tarjeta",
        label: "Pago confirmado",
        date: formatDate(order.paidAt),
        color: "#3b82f6",
      });
    if (order.acceptedAt)
      events.push({
        symbol: "✅",
        ariaLabel: "check",
        label: "Pedido aceptado",
        date: formatDate(order.acceptedAt),
        color: "#10b981",
      });
  }

  if (order.rejectedAt)
    events.push({
      symbol: "❌",
      ariaLabel: "cruz",
      label: "Pedido rechazado",
      date: formatDate(order.rejectedAt),
      color: "#ef4444",
    });

  if (events.length === 0) return null;

  return (
    <div
      style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}
    >
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 11,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Historial
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {events.map((ev, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
          >
            <Emoji symbol={ev.symbol} label={ev.ariaLabel} />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: ev.color }}>
                {ev.label}
              </span>
              {ev.date && (
                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>
                  {ev.date}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal de confirmación ─────────────────────────────────────────────────
function ConfirmModal({
  open,
  symbol,
  ariaLabel,
  title,
  message,
  onConfirm,
  onCancel,
  danger,
}) {
  if (!open) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>
          <Emoji symbol={symbol} label={ariaLabel} />
        </div>
        <h3 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: 18 }}>
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 24px",
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} style={styles.cancelBtn}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={danger ? styles.dangerBtn : styles.confirmBtn}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de pedido ─────────────────────────────────────────────────────
function OrderCard({ order, onAccept, onReject, onDelete, actionLoading }) {
  const isLoading = actionLoading === order.id;
  const cod = isCashOnDelivery(order);
  const needsAction = order.status === "pending" || order.status === "paid";
  const isResolved = order.status === "accepted" || order.status === "rejected";
  const borderColor = statusConfig[order.status]?.border || "#e2e8f0";

  return (
    <div
      style={{
        ...styles.card,
        borderLeft: `4px solid ${borderColor}`,
        opacity: isLoading ? 0.65 : 1,
        transition: "box-shadow 0.2s, opacity 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.09)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = styles.card.boxShadow)
      }
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Pedido #{order.id}
          </h3>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 13,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Emoji symbol="👤" label="usuario" />
            {order.userName || order.displayName || order.userEmail}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge status={order.status} />
          <PaymentBadge order={order} />
        </div>
      </div>

      {/* ── Aviso contra entrega ── */}
      {cod && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 8,
            background: "linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)",
            border: "1px solid #fde68a",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Emoji symbol="💵" label="efectivo" />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                color: "#92400e",
              }}
            >
              Pago contra entrega
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a16207" }}>
              El cliente pagará en efectivo al recibir el pedido.
            </p>
          </div>
        </div>
      )}

      {/* ── Total ── */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "#64748b" }}>Total del pedido</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
          {order.totalAmount ? `¥${order.totalAmount.toLocaleString()}` : "N/A"}
        </span>
      </div>

      {/* ── Productos ── */}
      <div style={{ marginBottom: 14 }}>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Productos
        </p>
        {order.items?.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#475569",
              padding: "5px 0",
              borderBottom:
                i < order.items.length - 1 ? "1px solid #f1f5f9" : "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center" }}>
              <Emoji symbol="🛍️" label="producto" />
              {item.name} × {item.quantity}
            </span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>
              {Number.isInteger(item.price * item.quantity)
                ? `¥${(item.price * item.quantity).toLocaleString()}`
                : `¥${(item.price * item.quantity).toFixed(0)}`}
            </span>
          </div>
        ))}
      </div>

      {/* ── Dirección completa ── */}
      {order.address && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Dirección de entrega
          </p>

          {(order.address.fullName ||
            order.address.firstName ||
            order.address.lastName) && (
            <p
              style={{
                margin: "0 0 3px",
                fontSize: 13,
                fontWeight: 600,
                color: "#1e293b",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Emoji symbol="👤" label="destinatario" />
              {order.address.fullName ||
                `${order.address.firstName || ""} ${order.address.lastName || ""}`.trim()}
            </p>
          )}

          {order.address.alias && (
            <p
              style={{
                margin: "0 0 3px",
                fontSize: 12,
                color: "#64748b",
                fontStyle: "italic",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Emoji symbol="🏷️" label="etiqueta" />
              {order.address.alias}
            </p>
          )}

          {order.address.street && (
            <p
              style={{
                margin: "0 0 3px",
                fontSize: 13,
                color: "#475569",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Emoji symbol="📍" label="ubicación" />
              {order.address.street}
              {order.address.apartment
                ? `, Dpto. ${order.address.apartment}`
                : ""}
            </p>
          )}

          {(order.address.city ||
            order.address.state ||
            order.address.zipCode) && (
            <p
              style={{
                margin: "0 0 3px",
                fontSize: 13,
                color: "#475569",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Emoji symbol="🏙️" label="ciudad" />
              {[order.address.city, order.address.state, order.address.zipCode]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

          {order.address.country && (
            <p
              style={{
                margin: "0 0 3px",
                fontSize: 13,
                color: "#475569",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Emoji symbol="🌐" label="país" />
              {order.address.country}
            </p>
          )}

          {(order.address.phoneNumber || order.address.phone) && (
            <p
              style={{
                margin: "0 0 3px",
                fontSize: 13,
                color: "#475569",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Emoji symbol="📞" label="teléfono" />
              {order.address.phoneNumber || order.address.phone}
            </p>
          )}
        </div>
      )}

      {/* ── Timeline ── */}
      <Timeline order={order} />

      {/* ── Botones de acción ── */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {order.status === "paid" && (
          <div
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              marginBottom: 6,
              background: "#eff6ff",
              border: "1px solid #93c5fd",
              fontSize: 13,
              fontWeight: 600,
              color: "#1d4ed8",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Emoji symbol="💳" label="tarjeta" />
            Pago con Stripe confirmado — pendiente de aceptación
          </div>
        )}

        {needsAction && (
          <>
            <button
              onClick={onAccept}
              disabled={isLoading}
              style={{
                ...styles.actionBtn,
                background: "#10b981",
                color: "#fff",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#059669")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#10b981")
              }
            >
              <Emoji symbol="✅" label="aceptar" />
              Aceptar pedido
            </button>
            <button
              onClick={onReject}
              disabled={isLoading}
              style={{
                ...styles.actionBtn,
                background: "#ef4444",
                color: "#fff",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#dc2626")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#ef4444")
              }
            >
              <Emoji symbol="❌" label="rechazar" />
              Rechazar pedido
            </button>
          </>
        )}

        {isResolved && (
          <div
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: order.status === "accepted" ? "#ecfdf5" : "#fef2f2",
              color: order.status === "accepted" ? "#059669" : "#dc2626",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Emoji
              symbol={order.status === "accepted" ? "✅" : "❌"}
              label={order.status === "accepted" ? "aceptado" : "rechazado"}
            />
            {order.status === "accepted"
              ? `Aceptado el ${formatDate(order.acceptedAt) || "—"}`
              : `Rechazado el ${formatDate(order.rejectedAt) || "—"}`}
          </div>
        )}

        <button
          onClick={onDelete}
          disabled={isLoading}
          style={{
            ...styles.actionBtn,
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid #e2e8f0",
            marginLeft: "auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fef2f2";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.borderColor = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <Emoji symbol="🗑️" label="eliminar" />
          Eliminar
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState({
    open: false,
    type: null,
    orderId: null,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedOrders = await orderService.getAllOrders();
      setOrders(fetchedOrders);
      setError(null);
    } catch (err) {
      console.error("Error al cargar los pedidos:", err);
      setError("Error al cargar los pedidos. Inténtalo de nuevo más tarde.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openModal = (type, orderId) => setModal({ open: true, type, orderId });
  const closeModal = () => setModal({ open: false, type: null, orderId: null });

  const handleConfirm = async () => {
    const { type, orderId } = modal;
    closeModal();
    setActionLoading(orderId);
    try {
      if (type === "accept") {
        await orderService.updateOrderStatus(orderId, "accepted");
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: "accepted", acceptedAt: new Date() }
              : o,
          ),
        );
      } else if (type === "reject") {
        await orderService.updateOrderStatus(orderId, "rejected");
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: "rejected", rejectedAt: new Date() }
              : o,
          ),
        );
      } else if (type === "delete") {
        await orderService.deleteOrder(orderId);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (err) {
      console.error(`Error en acción ${type}:`, err);
      alert("No se pudo completar la acción. Inténtalo de nuevo.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(
    (o) => filter === "all" || o.status === filter,
  );
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const modalConfig = {
    accept: {
      symbol: "✅",
      ariaLabel: "check",
      title: "¿Aceptar este pedido?",
      message:
        "El cliente recibirá una notificación. Si es contra entrega, el cobro se realiza al momento de la entrega.",
      danger: false,
    },
    reject: {
      symbol: "❌",
      ariaLabel: "cruz",
      title: "¿Rechazar este pedido?",
      message:
        "El cliente será notificado del rechazo. Esta acción quedará registrada.",
      danger: true,
    },
    delete: {
      symbol: "🗑️",
      ariaLabel: "basura",
      title: "¿Eliminar este pedido?",
      message:
        "Esta acción no se puede deshacer. El pedido se borrará permanentemente.",
      danger: true,
    },
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "32px 28px",
          maxWidth: 920,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Gestión de Pedidos
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} registrado
            {orders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filtros / Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            {
              key: "all",
              label: "Todos",
              count: orders.length,
              color: "#475569",
            },
            {
              key: "pending",
              label: "Pendientes (COD)",
              count: counts.pending || 0,
              color: "#f59e0b",
            },
            {
              key: "paid",
              label: "Por aceptar",
              count: counts.paid || 0,
              color: "#3b82f6",
            },
            {
              key: "accepted",
              label: "Aceptados",
              count: counts.accepted || 0,
              color: "#10b981",
            },
            {
              key: "rejected",
              label: "Rechazados",
              count: counts.rejected || 0,
              color: "#ef4444",
            },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "14px 12px",
                borderRadius: 10,
                border: `2px solid ${filter === key ? color : "transparent"}`,
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
                boxShadow:
                  filter === key
                    ? `0 0 0 3px ${color}22, 0 2px 6px rgba(0,0,0,0.06)`
                    : "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color }}>
                {count}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {label}
              </div>
            </button>
          ))}
        </div>

        {/* Estados */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <Emoji symbol="⏳" label="cargando" />
            <p>Cargando pedidos...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#dc2626",
              marginBottom: 20,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Emoji symbol="⚠️" label="advertencia" /> {error}
          </div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <Emoji symbol="📭" label="sin pedidos" />
            <p style={{ fontWeight: 600, margin: 0 }}>
              No hay pedidos
              {filter !== "all"
                ? ` con estado "${statusConfig[filter]?.label}"`
                : ""}
            </p>
          </div>
        )}

        {/* Lista de pedidos */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={() => openModal("accept", order.id)}
                onReject={() => openModal("reject", order.id)}
                onDelete={() => openModal("delete", order.id)}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ConfirmModal
        open={modal.open}
        symbol={modalConfig[modal.type]?.symbol}
        ariaLabel={modalConfig[modal.type]?.ariaLabel}
        title={modalConfig[modal.type]?.title}
        message={modalConfig[modal.type]?.message}
        danger={modalConfig[modal.type]?.danger}
        onConfirm={handleConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}

// ─── Estilos base ──────────────────────────────────────────────────────────
const styles = {
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "20px 22px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    border: "1px solid #e2e8f0",
  },
  actionBtn: {
    padding: "9px 18px",
    borderRadius: 8,
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    padding: "32px 28px",
    maxWidth: 400,
    width: "90%",
    textAlign: "center",
    boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
  },
  cancelBtn: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none",
    background: "#10b981",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  dangerBtn: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default Orders;
