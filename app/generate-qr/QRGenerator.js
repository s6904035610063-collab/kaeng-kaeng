"use client";

import { useState } from "react";

export default function QRGenerator() {
  const [table, setTable] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  function generateQR() {
    if (!table) {
      alert("กรุณาใส่เลขโต๊ะ");
      return;
    }

    const url = `${window.location.origin}/order/${table}`;
    setQrUrl(url);
  }

  return (
    <main className="page">
      <div className="qr-card">
        <h1>📱 สร้าง QR Code</h1>
        <p>ข้าวแกงบ้านเรา</p>

        <label>เลขโต๊ะ</label>

        <input
          type="number"
          placeholder="เช่น 1"
          value={table}
          onChange={(e) => setTable(e.target.value)}
        />

        <button onClick={generateQR} className="main-button">
          สร้าง QR Code
        </button>

        {qrUrl && (
          <div className="qr-result">
            <h2>โต๊ะ {table}</h2>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                qrUrl
              )}`}
              alt={`QR Code โต๊ะ ${table}`}
            />

            <p>{qrUrl}</p>

            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
                qrUrl
              )}`}
              target="_blank"
              rel="noreferrer"
              className="secondary-button"
            >
              เปิด QR ขนาดใหญ่
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
