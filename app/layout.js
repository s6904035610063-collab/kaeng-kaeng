import "./globals.css";

export const metadata = {
  title: "ข้าวแกงบ้านเรา",
  description: "ระบบสั่งอาหารร้านข้าวแกงบ้านเรา",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
