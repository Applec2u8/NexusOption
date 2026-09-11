# บันทึกการอัปเดตระบบ (Release Notes)
**วันที่:** 11 เมษายน 2026
**เวอร์ชัน:** Security & UX Premium Update

---

## 🛡️ ระบบความปลอดภัยและประวัติการเข้าใช้งาน (Security Enhancement)
*   **Detailed Login History:** อัปเกรดระบบจัดเก็บประวัติการเข้าสู่ระบบให้ละเอียดขึ้น
    *   **Device Detection:** ระบบสามารถวิเคราะห์รุ่นมือถือ (เช่น iPhone, Samsung), ระบบปฏิบัติการ (Windows, iOS, Android) และเบราว์เซอร์ที่ใช้ได้แม่นยำ
    *   **Visual History:** ปรับปรุงหน้าประวัติใน Settings ให้แสดงไอคอนตามประเภทอุปกรณ์ (คอมพิวเตอร์/มือถือ/แท็บเล็ต)
    *   **Legacy Support:** เพิ่มระบบจัดการข้อมูลเก่า (Legacy Session) เพื่อให้แสดงผลได้สวยงามเสมอ
*   **Internal Security:** เพิ่มการจัดเก็บข้อมูล IP Address และวันเวลาที่เข้าใช้งานจริงลงในฐานข้อมูล `user_login_history`

---

## 🏦 ระบบผูกบัญชีธนาคารและคริปโต 2.0 (Bank Details 2.0)
*   **Dual-Mode Selection:** เพิ่มตัวเลือกสลับระหว่าง "ธนาคารไทย" และ "กระเป๋าคริปโต (USDT)"
*   **Thai Bank Grid:** เพิ่มระบบเลือกธนาคารชั้นนำของไทย (กสิกร, SCB, กรุงเทพ ฯลฯ) พร้อมโลโก้และสีประจำธนาคาร
*   **Crypto Network Selector:** เพิ่มตัวเลือกเครือข่าย USDT มาตรฐาน (TRC-20, ERC-20, BEP-20)
*   **Real-time Validation:** ระบบตรวจสอบความถูกต้องทันทีขณะพิมพ์:
    *   เช็คเลขบัญชีธนาคาร (10-12 หลัก และต้องเป็นตัวเลข)
    *   เช็คที่อยู่กระเป๋าคริปโต (ตรวจสอบ Prefix เช่น 'T' หรือ '0x' และความยาวที่ถูกต้อง)
*   **Safety Lock:** ระบบจะล็อกปุ่ม "บันทึก" ทันทีหากข้อมูลไม่อยู่ในรูปแบบที่ถูกต้องเพื่อป้องกันเงินโอนผิดที่

---

## ⚙️ ระบบโครงสร้างพื้นฐานและการแก้ไขบั๊ก (Infrastructure & Bug Fixes)
*   **Push Notification Fix:** แก้ไขข้อผิดพลาด `ON CONFLICT` ในระบบแจ้งเตือน (Push) โดยการเพิ่มช่อง `endpoint` และตั้งค่า Unique Constraint ในฐานข้อมูล ทำให้ระบบทำงานได้เสถียร 100%
*   **UI/UX Standardization:** 
    *   เปลี่ยนการส่งข้อมูลในหน้า Settings ทั้งหมดให้เป็นรูปแบบ `<form>` เพื่อความสมบูรณ์ของระบบ
    *   ปรับปรุงระบบแจ้งเตือน (Toast) ให้แสดงผลที่มุมขวาบนแบบลื่นไหลด้วย `framer-motion`
*   **Performance:** แก้ไข Console Warning เกี่ยวกับ AnimatePresence ทำให้หน้าเว็บโหลดลื่นขึ้นและไม่มี Error กวนใจ

## 🔒 ระบบยืนยันตัวตนอัตโนมัติ (Auto-KYC Verification)
*   **Transaction Gating:** บล็อคการฝาก-ถอนเงินทุกกรณีหากผู้ใช้ยังมีสถานะ KYC เป็น `unverified` พร้อมปุ่มนำทาง (Go to Verify) ไปยังหน้าโปรไฟล์โดยตรง
*   **Auto-Approve Logic:** เมื่อผู้ใช้กรอกข้อมูลส่วนตัว (ชื่อ, เบอร์โทร, ที่อยู่) และข้อมูลบัญชีธนาคาร (ครบถ้วนและถูกต้อง) ระบบจะทำการตั้งค่า `kyc_status = verified` ให้อัตโนมัติทันที
*   **Synchronized State:** สถานะ Verified จะแสดงผลเป็นสีเขียวทันทีในแถบเมนูโดยไม่ต้องรีเฟรชหน้าต่าง

---

## 💸 อัปเกรดหน้าการถอนเงิน (Withdrawal UX Premium)
*   **Verified Display Card:** ยกเลิกช่องกรอกชื่อธนาคารและเลขบัญชีแบบแมนนวล ระบบจะดึงข้อมูลที่ผ่านการยืนยันแล้วจาก KYC เพื่อแสดงเป็น 'การ์ดแบบอ่านได้อย่างเดียว (Read-only)' เพื่อป้องกันการโอนเงินผิดบัญชี และป้องกันบัญชีม้า
*   **Processing Delay:** เพิ่มการหน่วงเวลาโหลดอนุมัติ (15 วินาที) เมื่อกดยืนยันการถอน เพื่อเพิ่มความสมจริงใน UX ก่อนพาสลับไปยังหน้า Tracking

---

## 📧 ระบบอีเมลและการแจ้งเตือนขั้นสูง (EmailJS System)
*   **Specialized Templates:** ดึงความสามารถของ EmailJS ขั้นสุดโดยเพิ่มเงื่อนไขรองรับเทมเพลต 3 รูปแบบ (OTP, Deposit, Win Celebration) 
*   **Dynamic Injection:** ดึงตัวแปรอัตโนมัติจากโค้ดเพื่อไปแสดงผลบนอีเมล เช่น ยอดเงินรางวัล, ยอดเดิมพัน, รหัสบิล (Ticket ID) ทันทีที่ผู้เล่นเทรดชนะ หรือทำรายการผ่าน
*   **Installation Guide Updated:** อัปเดตไฟล์ `คู่มือการติดตั้ง_ฉบับสมบูรณ์.md` ให้มีคำอธิบายวิธีก๊อปปี้โค้ด HTML ไปใช้กับตระกูล EmailJS แบบจับมือทำ

---

## ⌨️ ฟีเจอร์ใหม่: ปิด Modal ด้วยปุ่ม ESC (Global Keyboard Shortcut)
*   **ครอบคลุมทุก Modal:** เพิ่มการรองรับปุ่ม `Esc` เพื่อปิดหน้าต่าง Popup/Modal ทุกตัวในโปรเจกต์ โดยไม่ต้องกดปุ่มกากบาท `X`
*   **รายชื่อ Modal ที่รองรับ:**
    *   `DepositModal` — หน้าต่างฝากเงิน
    *   `WithdrawModal` — หน้าต่างถอนเงิน
    *   `Wallet.tsx` — Staking + Deposit + Withdraw (จากหน้า Wallet)
    *   `TradingPanel` — หน้าต่าง "Setup Option" (เลือกเวลาและจำนวนเงิน)
    *   `GlobalWinModal` — หน้าต่างแสดงรางวัลชนะการเทรด
    *   `Settings.tsx` — Sidebar (Mobile), Install Modal, Share Modal
    *   `Admin.tsx` — Edit User Panel, Create User Modal, Top-Up Modal
    *   `Trade.tsx` — Asset Search Panel, Market Details Panel
    *   `ShareModal`, `InstallModal`, `TopUpModal`, `CreateUserModal` — ทุกตัว
*   **Smart Priority:** หากมีหลาย Layer เปิดพร้อมกัน ระบบจะปิดจากชั้นบนสุดก่อนเสมอ

---

## 🎨 อัปเกรด UX หน้า Settings (Settings UX Polish)

### 🏦 Bank Details — Dropdown Selector
*   **เปลี่ยนจาก List → Dropdown:** แทนที่รายการธนาคารแบบ Full-List ด้วย Custom Dropdown ที่กะทัดรัดและสวยงามกว่า
*   **Quick-pick Style:** Dropdown แสดงโลโก้วงกลมสีของธนาคารที่เลือกอยู่ทางซ้าย พร้อมชื่อธนาคารเต็มๆ ทั้งภาษาไทยและอังกฤษ
*   **ประหยัดพื้นที่:** จากรายการยาวหลาย Row → กลายเป็น 1 บรรทัด ลดการ Scroll และดูสะอาดตากว่าเดิมมาก

### 🔗 KYC Inline Navigation
*   **ลบปุ่ม "ไปหน้ายืนยันตัวตน":** ลบปุ่มสีส้มขนาดใหญ่ที่ซ้ำซ้อนออก
*   **Inline Clickable Text:** คำว่า **(KYC)** ในประโยคแจ้งเตือนกลายเป็น Link ขีดเส้นใต้สีส้ม กดได้โดยตรงเพื่อไปยังหน้า Settings ทันที ทั้งใน DepositModal และ WithdrawModal
*   **สถานะ KYC:** แสดงเป็นตัวพิมพ์ใหญ่ `UNVERIFIED` เพื่อความชัดเจนยิ่งขึ้น

---
 
 ## 🌐 ระบบสลับภาษาและการแจ้งเตือนอัปเกรด (Multi-language & Smart Localization)
 *   **Database Language Sync:** ระบบจะจดจำการเลือกภาษา (ไทย/อังกฤษ) ของผู้ใช้ลงในฐานข้อมูล Profile โดยอัตโนมัติ เพื่อให้ระบบหลังบ้านส่งเมลแจ้งเตือนได้ถูกต้องตามภาษาที่คุณชอบ
 *   **Localized Win Notifications:** อีเมลฉลองชัยชนะ (Win Celebration) อัปเกรดให้รองรับภาษาไทย 100% โดยอ้างอิงจากภาษาที่ผู้ใช้เลือกในแอป
 *   **Global Default Language:** ปรับเปลี่ยนค่าเริ่มต้นของแอปพลิเคชันทั้งหมดให้เป็น **ภาษาอังกฤษ (English)** ตามความต้องการล่าสุด โดยยังคงรักษาความสามารถในการสลับเป็นภาษาไทยได้ทุกเมื่อ
 *   **Case-Insensitive Template Parameters:** ปรับปรุงความเสถียรของการส่งข้อมูลไปยัง EmailJS ให้รองรับทั้งตัวแปรแบบตัวเล็ก (`email_body`) และตัวใหญ่ (`EMAIL_BODY`) เพื่อให้ทำงานร่วมกับเทมเพลตของคุณได้อย่างไม่มีข้อผิดพลาด
 
 ---
 
 ## 🛠️ ขั้นตอนหลังการอัปเกรด (Post-Upgrade Steps)
 *   **SQL Update Required:** ผู้ดูแลระบบต้องรัน SQL เพื่อเพิ่มคอลัมน์เก็บภาษา:
     ```sql
     ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
     ```
 *   **Edge Function Redeploy:** รัน `npx supabase functions deploy resolve-trades --no-verify-jwt` เพื่อเปิดใช้งานระบบเมลภาษาไทยในขั้นตอนตัดสินผล
 
 ---
 
 **ทีมพัฒนา:** Antigravity AI (Google DeepMind Team)
 
