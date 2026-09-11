# บันทึกการอัปเดตระบบ (Release Notes)
**วันที่:** 12 เมษายน 2026
**เวอร์ชัน:** Admin Performance & Dashboard 3.0

---

## 📊 ระบบ Admin Activity Dashboard ใหม่ล่าสุด (Unified Activity Tracking)
*   **Unified Activity Logging:** รวบรวมข้อมูลความเคลื่อนไหวจาก 3 แหล่งหลักมาไว้ในที่เดียว:
    *   `transactions` (ฝาก, ถอน, ซื้อ, ขาย, ชนะ, แพ้)
    *   `binary_trades` (รายละเอียดการเทรด Binary)
    *   `user_login_history` (ประวัติการเข้าใช้งาน)
*   **Advanced Filtering & Search:**
    *   **Date Range:** กรองข้อมูลตามช่วงวันที่ต้องการ
    *   **Type Filter:** แยกหมวดหมู่กิจกรรมได้ชัดเจน (Deposit, Withdraw, Trade, Login)
    *   **Search by Private Code:** ฟีเจอร์ค้นหาผู้ใช้ด้วยรหัส 6 หลัก (เช่น ABC123) ระบบจะดึงชื่อและอีเมลมาให้โดยอัตโนมัติ
*   **UI/UX Modernization:**
    *   **Responsive Cards:** แสดงผลเป็น Card ที่อ่านง่ายบนมือถือ และเป็น Table ที่สวยงามบน Desktop
    *   **Paste Button:** เพิ่มปุ่ม "วาง" (Paste) ข้อมูลจากรหัสที่คัดลอกมาได้ทันที
    *   **Smooth Navigation:** ระบบ Auto-scroll ขึ้นด้านบนแบบนุ่มนวลเมื่อมีการเปลี่ยนหน้า

---

## ⚡ การปรับปรุงประสิทธิภาพ (Performance Optimizations)
*   **Pagination System:** เปลี่ยนจากการโหลดข้อมูลทั้งหมดมาเป็นการแบ่งหน้า (50 รายการต่อหน้า) เพื่อลดภาระของ Browser และ Database
*   **Motion Overhead Removal:** ถอดไลบรารี `framer-motion` ออกจากรายการข้อมูล (Row-level) เพื่อความรวดเร็วในการ Render ข้อมูลจำนวนมากหลักร้อยรายการ
*   **Advanced React Logic:**
    *   ใช้ `React.memo` เพื่อป้องกันการ Re-render ส่วนที่ไม่จำเป็น
    *   ใช้ `useTransition` เพื่อให้ UI ยังคงตอบสนองได้ทันที (Responsive) แม้ในขณะที่ข้อมูลกำลังถูกกรองหรือประมวลผล
*   **Database Latency Fix:** จำกัดการดึงข้อมูลสูงสุดเพียง 100 รายการล่าสุดต่อการค้นหาหนึ่งครั้ง เพื่อความเร็วสูงสุดในทุกสถานการณ์

---

## 🛠️ การแก้ไขและปรับปรุงอื่นๆ (Fixes & Improvements)
*   **Stale Closure Fix:** แก้ไขบั๊กการค้นหารหัสผู้ใช้ที่บางครั้งค่าสถานะไม่อัปเดตทันที ทำให้ระบบค้นหาทำงานได้แม่นยำ 100%
*   **Smooth Top Scroll:** เพิ่ม `useEffect` จัดการการเลื่อนหน้าจอขึ้นด้านบนเมื่อผู้ใช้งานกด Next Page เพื่อ UX ที่เป็นธรรมชาติ

---

**ทีมพัฒนา:** Antigravity AI (Google DeepMind Team)
