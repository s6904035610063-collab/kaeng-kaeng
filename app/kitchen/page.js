"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("orders-kitchen")
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

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .neq("status", "served")
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("เปลี่ยนสถานะไม่สำเร็จ");
    }
  }

  function statusText(status) {
    if (status === "received") return "รับออเดอร์";
    if (status === "cooking") return "กำลังทำ";
    if (status === "served") return "เสิร์ฟแล้ว";

    return status;
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">กำลังโหลดออเดอร์...</div>
      </main>
    );
  }

  return (
    <main className="kitchen-page">
      <header className="kitchen-header">
        <div>
          <h1>👨‍🍳 ห้องครัว</h1>
          <p>ข้าวแกงบ้านเรา</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadOrders}
        >
          ↻ รีเฟรช
        </button>
      </header>

      {orders.length === 0 ? (
        <div className="empty-kitchen">
          <div>🍽️</div>
          <h2>ยังไม่มีออเดอร์</h2>
          <p>รอออเดอร์ใหม่จากลูกค้า</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div
              className={`order-card ${order.status}`}
              key={order.id}
            >
              <div className="order-top">
                <div>
                  <h2>โต๊ะ {order.table_number}</h2>
                  <span>
                    {formatTime(order.created_at)}
                  </span>
                </div>

                <span className="status">
                  {statusText(order.status)}
                </span>
              </div>

              <div className="order-items">
                {order.items?.map((item, index) => (
                  <div
                    className="kitchen-item"
                    key={index}
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>

                    <strong>
                      {Number(item.price) *
                        Number(item.quantity)}{" "}
                      บาท
                    </strong>
                  </div>
                ))}
              </div>

              {order.total && (
                <div className="order-total">
                  รวม {order.total} บาท
                </div>
              )}

              <div className="kitchen-actions">
                {order.status === "received" && (
                  <button
                    onClick={() =>
                      updateStatus(order.id, "cooking")
                    }
                  >
                    👨‍🍳 เริ่มทำอาหาร
                  </button>
                )}

                {order.status === "cooking" && (
                  <button
                    onClick={() =>
                      updateStatus(order.id, "served")
                    }
                  >
                    ✓ เสิร์ฟแล้ว
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
