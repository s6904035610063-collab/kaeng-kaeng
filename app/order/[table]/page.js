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

  // จำนวนผู้ใหญ่และเด็ก
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // โหลดเมนู
  useEffect(() => {
    async function loadMenu() {
      const { data: categoryData } = await supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      const { data: itemData } = await supabase
        .from("menu_items")
        .select("*")
        .order("id", { ascending: true });

      setCategories(categoryData || []);
      setMenuItems(itemData || []);

      if (categoryData && categoryData.length > 0) {
        setActiveCategory(categoryData[0].id);
      }

      setLoading(false);
    }

    loadMenu();
  }, []);

  // เพิ่มสินค้า
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

  // ลดสินค้า
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

  // เพิ่มจำนวนสินค้า
  function increaseItem(id) {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  // จำนวนรายการทั้งหมด
  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // ราคารวม
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ส่งออเดอร์
  async function submitOrder() {
    if (cart.length === 0) {
      alert("กรุณาเลือกอาหารก่อนสั่ง");
      return;
    }

    if (adults + children <= 0) {
      alert("กรุณาระบุจำนวนผู้ใหญ่หรือเด็ก");
      return;
    }

    setSending(true);

    try {
      // สร้าง session
      const { data: session, error: sessionError } = await supabase
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
        alert("ไม่สามารถสร้างรายการสั่งอาหารได้");
        setSending(false);
        return;
      }

      // เตรียมข้อมูลสินค้า
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
        alert("ไม่สามารถส่งออเดอร์ได้");
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

  // หน้าหลังสั่งสำเร็จ
  if (success) {
    return (
      <main className="page">
        <div className="success-card">
          <div className="success-icon">✅</div>

          <h1>สั่งอาหารสำเร็จ!</h1>

          <p>
            โต๊ะ {table}
          </p>

          <p>
            👨 ผู้ใหญ่ {adults} คน
            {" / "}
            👶 เด็ก {children} คน
          </p>

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
    (item) => item.category_id === activeCategory
  );

  return (
    <main className="page order-page">
      <div className="order-container">

        {/* Header */}
        <header className="order-header">
          <div>
            <h1>🍛 ข้าวแกงบ้านเรา</h1>
            <p>อร่อยเหมือนกินข้าวที่บ้าน</p>
          </div>

          <div className="table-number">
            โต๊ะ {table}
          </div>
        </header>

        {/* จำนวนคน */}
        <section className="people-card">
          <h2>👨‍👩‍👧 จำนวนผู้ใช้บริการ</h2>

          <div className="people-grid">

            <div className="people-input">
              <label>👨 ผู้ใหญ่</label>

              <div className="number-control">
                <button
                  type="button"
                  onClick={() =>
                    setAdults(Math.max(0, adults - 1))
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
            </div>

            <div className="people-input">
              <label>👶 เด็ก</label>

              <div className="number-control">
                <button
                  type="button"
                  onClick={() =>
                    setChildren(Math.max(0, children - 1))
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
            </div>

          </div>

          <p className="people-total">
            รวมทั้งหมด {adults + children} คน
          </p>
        </section>

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
              (c) => c.id === activeCategory
            )?.name || "เมนู"}
          </h2>

          <div className="menu-grid">
            {filteredItems.map((item) => {
              const cartItem = cart.find(
                (x) => x.id === item.id
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
                      <strong>{item.name}</strong>
                      <p>
                        {item.price} ×{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <div className="cart-price">
                      {item.price * item.quantity} บาท
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

              {/* สรุป */}
              <div className="total">
                <span>
                  รวม {totalItems} รายการ
                </span>

                <strong>
                  {total} บาท
                </strong>
              </div>

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
