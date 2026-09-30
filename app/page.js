"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <div className="home-card">
        <div className="logo">🍛</div>

        <h1>ข้าวแกงบ้านเรา</h1>
        <p>อร่อยเหมือนกินข้าวที่บ้าน</p>

        <div className="home-buttons">
          <Link href="/generate-qr" className="main-button">
            📱 สร้าง QR โต๊ะ
          </Link>

          <Link href="/kitchen" className="secondary-button">
            👨‍🍳 หน้าครัว
          </Link>
        </div>
      </div>
    </main>
  );
}
