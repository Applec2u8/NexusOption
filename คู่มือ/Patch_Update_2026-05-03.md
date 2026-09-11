# รายงานการอัปเดตระบบ (Patch Update) - 2026-05-03

การอัปเดตในวันนี้มุ่งเน้นไปที่การเพิ่มประสิทธิภาพการทำงานของแพลตฟอร์ม (Performance Optimization) และการเพิ่มความโปร่งใสในการบริหารจัดการระบบส่งอีเมล (Email Infrastructure Transparency)

## 1. ระบบบริหารจัดการอีเมล (Email Provider Tracking)

เราได้เพิ่มระบบ Telemetry เพื่อติดตามปริมาณการใช้งานอีเมลของแต่ละ Provider แบบละเอียด:
- **Sent Count Tracking**: เพิ่มฟิลด์ `sent_count` ในฐานข้อมูลเพื่อเก็บสถิติจำนวนอีเมลที่ส่งสำเร็จจริง
- **Monthly Auto-Reset**: ระบบจะตรวจสอบเดือนปัจจุบันกับ `last_email_reset_month` ในตั้งค่า Global หากเข้าสู่เดือนใหม่ ระบบจะรีเซ็ตสถิติทุก Provider เป็น 0 โดยอัตโนมัติ
- **Real-time Display**: หน้า Admin Settings สามารถดูสถิติการส่งได้ทันที พร้อมตัวบ่งชี้สถานะที่ชัดเจนบนมือถือ

## 2. การปรับปรุงประสิทธิภาพ (Performance Optimization)

แก้ไขปัญหา "การคลิกแล้วหน่วง" (UI Lag) โดยการปรับโครงสร้างคอมโพเนนต์ใหม่:
- **Timer Isolation**: แยก Logic ตัวนับเวลาถอยหลังออกจากคอมโพเนนต์หลัก ทำให้ไม่ต้อง Re-render ทั้งหน้าจอทุกวินาที
- **Memoization Strategy**: ใช้ `React.useMemo` และ `React.memo` ในจุดที่มีการคำนวณสูง เช่น การกรองประวัติธุรกรรม และรายการสินทรัพย์
- **Animation Refinement**: ลดการใช้ `layoutId` ที่กินทรัพยากรสูงใน Mobile Navigation เพื่อให้การสลับเมนูทำได้ทันที

## 3. ความปลอดภัยและการลบข้อมูล (Secure Deletion)

เพิ่มความปลอดภัยในส่วนของ Admin เพื่อป้องกันการลบข้อมูลโดยไม่ตั้งใจ:
- **Confirm to Delete**: ระบบจะบังคับให้พิมพ์คำว่า "confirm" ก่อนที่จะอนุญาตให้ลบ Email Provider ออกจากระบบ
- **Responsive Stats**: ปรับปรุงการแสดงผลสถิติบนมือถือให้สวยงามและอ่านง่ายขึ้น (Flex-wrap & Balanced Layout)

## 4. โครงสร้างฐานข้อมูล (Database Schema)

ผู้ดูแลระบบต้องรันคำสั่ง SQL ต่อไปนี้เพื่อให้ระบบใหม่ทำงานได้สมบูรณ์:

```sql
-- เพิ่มคอลัมน์เก็บสถิติการส่งอีเมล
ALTER TABLE email_providers ADD COLUMN sent_count INTEGER DEFAULT 0;

-- เพิ่มคอลัมน์เก็บเดือนล่าสุดที่มีการรีเซ็ตสถิติ
ALTER TABLE global_settings ADD COLUMN last_email_reset_month TEXT;

-- ตั้งค่าเริ่มต้นเป็นเดือนปัจจุบัน
UPDATE global_settings SET last_email_reset_month = TO_CHAR(NOW(), 'YYYY-MM') WHERE id = 'main';
```

## 5. การเปลี่ยนแปลงไฟล์ที่สำคัญ (Key File Changes)
- `src/services/emailService.ts`: เพิ่ม Logic การนับจำนวนการส่งและระบบ Auto-reset
- `src/components/admin/tabs/SettingsTab.tsx`: ปรับปรุง UI และระบบความปลอดภัยการลบ
- `src/components/trade/TradingPanel.tsx`: แยก Component ย่อยเพื่อลดภาระการ Render
- `src/pages/History.tsx`: เพิ่มประสิทธิภาพการโหลดรายการประวัติ
