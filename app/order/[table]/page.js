"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OrderPage({ params }) {
  const { table } = use(params);

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");

  // จำนวนคน
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // โหลดหมวดหมู่และเมนู
  useEffect(() => {
    async function loadMenu() {
      const { data: categoryData, error: categoryError } =
        await supabase
          .from("menu_categories")
          .select("*")
          .order("sort_order", { ascending: true });

      const { data: itemData, error: itemError } =
        await supabase
          .from("menu_items")
          .select("*")
          .order("id", { ascending: true });

      if (categoryError) {
        console.error(categoryError);
      }

      if (itemError) {
        console.error(itemError);
      }

      setCategories(categoryData || []);
      setMenuItems(itemData || []);

      if (categoryData && categoryData.length > 0) {
        setActiveCategory(categoryData[0].id);
      }

      setLoading(false);
    }

    loadMenu();
  }, []);

  // เพิ่มอาหาร
  function addToCart(item) {
    setCart((current) => {
      const existing = current.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
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

  // เพิ่มจำนวนอาหาร
  function increaseItem(id) {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  // ลดจำนวนอาหาร
  function decreaseItem(id) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // จำนวนรายการ
  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // ราคารวม
  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  // ส่งออเดอร์
  async function submitOrder() {
    if (adults + children <= 0) {
      alert("กรุณาระบุจำนวนผู้ใหญ่หรือเด็ก");
      return;
    }

    if (cart.length === 0) {
      alert("กรุณาเลือกอาหารก่อนสั่ง");
      return;
    }

    setSending(true);

    try {
      // สร้าง session
      const { data: session, error: sessionError } =
        await supabase
          .from("sessions")
          .insert({
            table_number: table,
            order_note: note,
            adults: adults,
            children: children,
            status: "active",
          })
          .select()
          .single();

      if (sessionError) {
        console.error(sessionError);
        alert(
          "สร้างรายการไม่สำเร็จ กรุณาตรวจสอบ Supabase"
        );
        setSending(false);
        return;
      }

      // เตรียมรายการอาหาร
      const orderItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      // สร้าง order
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          session_id: session.id,
          table_number: table,
          items: orderItems,
          total: total,
          status: "received",
        });

      if (orderError) {
        console.error(orderError);
        alert("ส่งออเดอร์ไม่สำเร็จ");
        setSending(false);
        return;
      }

      setSuccess(true);
      setCart([]);
      setNote("");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }

    setSending(false);
  }

  if (loading) {
    return (
      <main className="page">
        <div className="card">
          <h2>กำลังโหลดเมนู...</h2>
        </div>
      </main>
    );
  }

  // หลังสั่งอาหารสำเร็จ
  if (success) {
    return (
      <main className="page">
        <div className="success-card">
          <div className="success-icon">
            ✅
          </div>

          <h1>สั่งอาหารสำเร็จ!</h1>

          <p>โต๊ะ {table}</p>

          <div
            style={{
              marginTop: "15px",
              marginBottom: "15px",
              fontSize: "18px",
            }}
          >
            👨 ผู้ใหญ่ {adults} คน
            <br />
            👶 เด็ก {children} คน
            <br />
            👨‍👩‍👧 รวม {adults + children} คน
          </div>

          <p>ร้านกำลังเตรียมอาหารให้ค่ะ</p>

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

  const filteredItems = menuItems.filter(
    (item) =>
      item.category_id === activeCategory
  );

  return (
    <main className="page">
      <div className="order-container">

        {/* หัวเว็บ */}
        <div className="order-header">
          <div>
            <h1>🍛 ข้าวแกงบ้านเรา</h1>
            <p>อร่อยเหมือนกินข้าวที่บ้าน</p>
          </div>

          <div className="table-number">
            โต๊ะ {table}
          </div>
        </div>

        {/* จำนวนผู้ใหญ่ / เด็ก */}
        <div className="people-card">
          <h2>👨‍👩‍👧 จำนวนผู้ใช้บริการ</h2>

          <div className="people-grid">

            <div className="people-box">
              <div className="people-title">
                👨 ผู้ใหญ่
              </div>

              <div className="number-control">
                <button
                  type="button"
                  onClick={() =>
                    setAdults(
                      Math.max(0, adults - 1)
                    )
                  }
                >
                  −
                </button>

                <span>{adults}</span>

                <button
                  type="button"
                  onClick={() =>
                    setAdults(adults + 1)
                  }
                >
                  +
                </button>
              </div>

              <small>คน</small>
            </div>

            <div className="people-box">
              <div className="people-title">
                👶 เด็ก
              </div>

              <div className="number-control">
                <button
                  type="button"
                  onClick={() =>
                    setChildren(
                      Math.max(0, children - 1)
                    )
                  }
                >
                  −
                </button>

                <span>{children}</span>

                <button
                  type="button"
                  onClick={() =>
                    setChildren(children + 1)
                  }
                >
                  +
                </button>
              </div>

              <small>คน</small>
            </div>

          </div>

          <div className="people-total">
            รวมทั้งหมด{" "}
            <strong>
              {adults + children}
            </strong>{" "}
            คน
          </div>
        </div>

        {/* หมวดหมู่ */}
        <div className="category-list">
          {categories.map((category) => (
            <button
              key={category.id}
              className={
                activeCategory === category.id
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() =>
                setActiveCategory(category.id)
              }
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* เมนู */}
        <section className="menu-section">
          <h2>
            {categories.find(
              (category) =>
                category.id === activeCategory
            )?.name || "เมนู"}
          </h2>

          <div className="menu-grid">
            {filteredItems.map((item) => {
              const cartItem = cart.find(
                (cartItem) =>
                  cartItem.id === item.id
              );

              return (
                <div
                  className="menu-card"
                  key={item.id}
                >
                  <div className="menu-info">
                    <h3>{item.name}</h3>

                    {item.description && (
                      <p>{item.description}</p>
                    )}

                    <strong>
                      {item.price} บาท
                    </strong>
                  </div>

                  {cartItem ? (
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          decreaseItem(item.id)
                        }
                      >
                        −
                      </button>

                      <span>
                        {cartItem.quantity}
                      </span>

                      <button
                        onClick={() =>
                          increaseItem(item.id)
                        }
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="add-button"
                      onClick={() =>
                        addToCart(item)
                      }
                    >
                      + เพิ่ม
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ตะกร้า */}
        <section className="cart-section">
          <h2>🛒 รายการที่เลือก</h2>

          {cart.length === 0 ? (
            <p className="empty-cart">
              ยังไม่ได้เลือกอาหาร
            </p>
          ) : (
            <>
              <div className="cart-list">
                {cart.map((item) => (
                  <div
                    className="cart-item"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <p>
                        {item.price} ×{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <div className="cart-price">
                      {item.price *
                        item.quantity}{" "}
                      บาท
                    </div>
                  </div>
                ))}
              </div>

              {/* หมายเหตุ */}
              <textarea
                placeholder="หมายเหตุเพิ่มเติม เช่น ไม่เผ็ด"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
              />

              {/* รวมราคา */}
              <div className="total">
                <span>
                  รวม {totalItems} รายการ
                </span>

                <strong>
                  {total} บาท
                </strong>
              </div>

              {/* ปุ่มสั่ง */}
              <button
                className="order-button"
                onClick={submitOrder}
                disabled={sending}
              >
                {sending
                  ? "กำลังส่ง..."
                  : "🍛 ยืนยันการสั่งอาหาร"}
              </button>
            </>
          )}
        </section>

      </div>
    </main>
  );
}
