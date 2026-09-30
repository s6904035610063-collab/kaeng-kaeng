"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        sessions (
          adults,
          children,
          order_note
        )
      `)
      .neq("status", "served")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
      return;
    }

    loadOrders();
  }

  function getStatusText(status) {
    if (status === "received") return "รับออเดอร์แล้ว";
    if (status === "cooking") return "กำลังทำ";
    if (status === "served") return "เสิร์ฟแล้ว";

    return status;
  }

  function getStatusClass(status) {
    if (status === "received") return "status-received";
    if (status === "cooking") return "status-cooking";
    if (status === "served") return "status-served";

    return "";
  }

  if (loading) {
    return (
      <main className="page">
        <div className="card">
          <h2>กำลังโหลดออเดอร์...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="page kitchen-page">
      <div className="kitchen-container">

        <header className="kitchen-header">
          <div>
            <h1>👨‍🍳 หน้าครัว</h1>
            <p>ข้าวแกงบ้านเรา</p>
          </div>

          <div className="order-count">
            {orders.length} ออเดอร์
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="empty-kitchen">
            <div>🍛</div>
            <h2>ยังไม่มีออเดอร์</h2>
            <p>เมื่อมีลูกค้าสั่งอาหาร ออเดอร์จะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="kitchen-orders">

            {orders.map((order) => {
              const session = order.sessions;

              return (
                <div
                  className="kitchen-order-card"
                  key={order.id}
                >

                  {/* หัวออเดอร์ */}
                  <div className="kitchen-order-header">
                    <div>
                      <h2>
                        🪑 โต๊ะ {order.table_number}
                      </h2>

                      <p>
                        {new Date(
                          order.created_at
                        ).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <span
                      className={`order-status ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  {/* จำนวนคน */}
                  <div className="customer-count">
                    <span>
                      👨 ผู้ใหญ่{" "}
                      <strong>
                        {session?.adults || 0}
                      </strong>{" "}
                      คน
                    </span>

                    <span>
                      👶 เด็ก{" "}
                      <strong>
                        {session?.children || 0}
                      </strong>{" "}
                      คน
                    </span>

                    <span>
                      👨‍👩‍👧 รวม{" "}
                      <strong>
                        {(session?.adults || 0) +
                          (session?.children || 0)}
                      </strong>{" "}
                      คน
                    </span>
                  </div>

                  {/* รายการอาหาร */}
                  <div className="kitchen-items">
                    {Array.isArray(order.items) &&
                      order.items.map((item, index) => (
                        <div
                          className="kitchen-item"
                          key={index}
                        >
                          <div>
                            <strong>
                              {item.name}
                            </strong>
                          </div>

                          <span>
                            × {item.quantity}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* หมายเหตุ */}
                  {session?.order_note && (
                    <div className="kitchen-note">
                      📝 หมายเหตุ:{" "}
                      {session.order_note}
                    </div>
                  )}

                  {/* ราคารวม */}
                  <div className="kitchen-total">
                    <span>รวมทั้งหมด</span>

                    <strong>
                      {order.total} บาท
                    </strong>
                  </div>

                  {/* ปุ่มเปลี่ยนสถานะ */}
                  <div className="kitchen-actions">

                    {order.status === "received" && (
                      <button
                        className="cook-button"
                        onClick={() =>
                          updateStatus(
                            order.id,
                            "cooking"
                          )
                        }
                      >
                        👨‍🍳 เริ่มทำอาหาร
                      </button>
                    )}

                    {order.status === "cooking" && (
                      <button
                        className="serve-button"
                        onClick={() =>
                          updateStatus(
                            order.id,
                            "served"
                          )
                        }
                      >
                        ✅ เสิร์ฟแล้ว
                      </button>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}
