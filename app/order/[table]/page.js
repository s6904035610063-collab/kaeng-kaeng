"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OrderPage({ params }) {
  const { table } = use(params);

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setLoading(true);

    const { data: categoryData, error: categoryError } =
      await supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order");

    const { data: itemData, error: itemError } =
      await supabase
        .from("menu_items")
        .select("*")
        .order("id");

    if (categoryError || itemError) {
      console.error(categoryError || itemError);
      alert("โหลดเมนูไม่สำเร็จ");
      setLoading(false);
      return;
    }

    setCategories(categoryData || []);
    setMenuItems(itemData || []);
    setLoading(false);
  }

  function addToCart(item) {
    setCart((current) => {
      const existing = current.find((x) => x.id === item.id);

      if (existing) {
        return current.map((x) =>
          x.id === item.id
            ? { ...x, quantity: x.quantity + 1 }
            : x
        );
      }

      return [
        ...current,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  }

  function decreaseItem(id) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function increaseItem(id) {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  async function submitOrder() {
    if (cart.length === 0) {
      alert("กรุณาเลือกอาหารก่อน");
      return;
    }

    setSending(true);

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          table_number: Number(table),
          order_note: note,
          status: "active",
        },
      ])
      .select()
      .single();

    if (sessionError) {
      console.error(sessionError);
      alert("สร้างรายการสั่งอาหารไม่สำเร็จ");
      setSending(false);
      return;
    }

    const orderItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          session_id: session.id,
          table_number: Number(table),
          items: orderItems,
          total,
          status: "received",
        },
      ]);

    if (orderError) {
      console.error(orderError);
      alert("ส่งออเดอร์ไม่สำเร็จ");
      setSending(false);
      return;
    }

    setSuccess(true);
    setCart([]);
    setNote("");
    setSending(false);
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">กำลังโหลดเมนู...</div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="page">
        <div className="success-card">
          <div className="success-icon">✓</div>

          <h1>สั่งอาหารสำเร็จ!</h1>

          <p>โต๊ะ {table}</p>
          <p>ร้านกำลังเตรียมอาหารให้คุณ</p>

          <button
            className="main-button"
            onClick={() => setSuccess(false)}
          >
            สั่งอาหารเพิ่ม
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="order-page">
      <header className="order-header">
        <div>
          <h1>🍛 ข้าวแกงบ้านเรา</h1>
          <p>โต๊ะ {table}</p>
        </div>
      </header>

      <section className="menu-container">
        {categories.map((category) => {
          const items = menuItems.filter(
            (item) => item.category_id === category.id
          );

          if (items.length === 0) return null;

          return (
            <section key={category.id} className="menu-section">
              <h2>{category.name}</h2>

              <div className="menu-grid">
                {items.map((item) => {
                  const cartItem = cart.find(
                    (x) => x.id === item.id
                  );

                  return (
                    <div className="menu-card" key={item.id}>
                      <div className="menu-info">
                        <h3>{item.name}</h3>

                        {item.description && (
                          <p>{item.description}</p>
                        )}

                        <strong>{item.price} บาท</strong>
                      </div>

                      {!cartItem ? (
                        <button
                          className="add-button"
                          onClick={() => addToCart(item)}
                        >
                          + เพิ่ม
                        </button>
                      ) : (
                        <div className="quantity">
                          <button
                            onClick={() => decreaseItem(item.id)}
                          >
                            −
                          </button>

                          <span>{cartItem.quantity}</span>

                          <button
                            onClick={() => increaseItem(item.id)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>

      <section className="cart-box">
        <h2>🛒 รายการที่เลือก</h2>

        {cart.length === 0 ? (
          <p className="empty">ยังไม่ได้เลือกอาหาร</p>
        ) : (
          <>
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <span>
                  {item.name} × {item.quantity}
                </span>

                <strong>
                  {Number(item.price) * item.quantity} บาท
                </strong>
              </div>
            ))}

            <textarea
              placeholder="หมายเหตุเพิ่มเติม เช่น ไม่เผ็ด"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="total">
              <span>
                รวม {totalItems} รายการ
              </span>

              <strong>{total} บาท</strong>
            </div>

            <button
              className="order-button"
              onClick={submitOrder}
              disabled={sending}
            >
              {sending ? "กำลังส่ง..." : "🍛 ยืนยันการสั่งอาหาร"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
