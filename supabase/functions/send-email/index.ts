import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
// Using the email address you registered with Brevo
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "apple.emd.a01@gmail.com"; 
const SENDER_NAME = Deno.env.get("SENDER_NAME") || "Nexus Option";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TRANSLATIONS: Record<string, any> = {
  th: {
    verification_subject: "ยืนยันบัญชีผู้ใช้ Nexus Option",
    reset_subject: "เปลี่ยนรหัสผ่าน Nexus Option",
    greeting: "สวัสดีครับคุณ",
    body: "เพื่อความปลอดภัย โปรดใช้รหัสยืนยันตัวตน (OTP) ด้านล่างนี้เพื่อดำเนินการต่อในระบบ Nexus Option ครับ",
    otp_label: "รหัสยืนยันของคุณคือ",
    expiry: "รหัสนี้จะหมดอายุภายใน 15 นาที เมื่อถึงเวลา",
    warning: "โปรดอย่าแชร์รหัสนี้ให้ผู้อื่นเด็ดขาด หากคุณไม่ได้ขอยืนยันตัวตนนี้ โปรดติดต่อเราทันที",
    change_email_subject: "เปลี่ยนอีเมลใหม่ Nexus Option",
    change_email_body: "โปรดใช้รหัสยืนยันตัวตน (OTP) ด้านล่างนี้เพื่อยืนยันการเปลี่ยนอีเมลของคุณในระบบ Nexus Option ครับ",
    deposit_subject: "✅ เติมเงินสำเร็จ — Nexus Option",
    deposit_body: "บัญชีของคุณได้รับการเติมเงินเรียบร้อยแล้ว",
    deposit_label: "จำนวนเงินที่เติม",
    deposit_warning: "แจ้งเตือนการเติมเงินเมื่อวันที่",
    win_subject: "🏆 คุณชนะแล้ว! — Nexus Option",
    win_body: "ขอแสดงความยินดี! การทายผล Binary Option ของคุณถูกต้อง",
    win_label: "เงินรางวัลที่ได้รับ",
    win_warning: "ยอดเงินได้รับการเครดิตเข้าบัญชีของคุณแล้ว",
    win_title: "ขอแสดงความยินดี!",
    credited_note: "เครดิตเข้าบัญชีแล้ว",
    footer_brand: "Nexus Option",
    footer_auto: "นี่คือข้อความอัตโนมัติ กรุณาอย่าตอบกลับ",
    trade_details: "รายละเอียดการเทรด:",
    asset: "สินทรัพย์",
    direction: "ทิศทาง",
    duration: "ระยะเวลา",
    payout_rate: "อัตราผลตอบแทน",
    stake: "เงินเดิมพัน",
    net_profit: "กำไรสุทธิ",
    up: "📈 ทายขึ้น (CALL)",
    down: "📉 ทายลง (PUT)",
    min: "นาที",
    order_id: "เลขที่บิล / Order ID"
  },
  en: {
    verification_subject: "Nexus Option Account Verification",
    reset_subject: "Nexus Option Password Reset",
    greeting: "Hello",
    body: "For your security, please use the following One-Time Password (OTP) to continue in Nexus Option.",
    otp_label: "Your verification code is",
    expiry: "This code will expire in 15 minutes at around",
    warning: "Do not share this code with anyone. If you didn't request this, please contact support immediately.",
    change_email_subject: "Nexus Option Email Change",
    change_email_body: "Please use the following One-Time Password (OTP) to confirm your email change in Nexus Option.",
    deposit_subject: "✅ Deposit Successful — Nexus Option",
    deposit_body: "Your account has been successfully topped up.",
    deposit_label: "Amount deposited",
    deposit_warning: "Deposit notification from",
    win_subject: "🏆 You Won! — Nexus Option",
    win_body: "Congratulations! Your Binary Option prediction was correct.",
    win_label: "Payout received",
    win_warning: "The payout has been credited to your account balance.",
    win_title: "Congratulations!",
    credited_note: "Credited to account",
    footer_brand: "Nexus Option",
    footer_auto: "This is an automated message, please do not reply.",
    trade_details: "Trade Details:",
    asset: "Asset",
    direction: "Direction",
    duration: "Duration",
    payout_rate: "Payout Rate",
    stake: "Stake",
    net_profit: "Net Profit",
    up: "📈 Predict UP (CALL)",
    down: "📉 Predict DOWN (PUT)",
    min: "min",
    order_id: "Order ID"
  }
};

const TEMPLATES = {
  otp: `<!DOCTYPE html>
<html lang="{{lang}}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>{{email_subject}}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .card-body { background-color: #1e293b !important; }
      .name-text { color: #f1f5f9 !important; }
      .body-text { color: #94a3b8 !important; }
      .otp-wrap  { background-color: #172033 !important; border-color: #3b82f6 !important; }
      .otp-lbl   { color: #60a5fa !important; }
      .otp-code  { color: #ffffff !important; }
      .info-wrap { background-color: #172033 !important; border-left-color: #3b82f6 !important; }
      .info-text { color: #94a3b8 !important; }
      .info-time { color: #e2e8f0 !important; }
      .warn-wrap { background-color: #1c1a14 !important; border-left-color: #f59e0b !important; }
      .warn-text { color: #d97706 !important; }
      .foot-bg   { background-color: transparent !important; border-top-color: #1e293b !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <div align="center" style="padding:40px 10px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:440px;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(0,0,0,0.05);">
      <tr>
        <td bgcolor="#1e3a5f" style="background-color:#1e3a5f;padding:24px 28px 20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:4px;color:#60a5fa;text-transform:uppercase;">Nexus Option</p>
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;line-height:1.25;">{{email_title}}</h1>
          <p style="margin:5px 0 0;font-size:12px;color:#94a3b8;">{{email_subject}}</p>
        </td>
      </tr>
      <tr>
        <td class="card-body" bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 24px 20px;">
          <p class="body-text" style="margin:0 0 2px;font-size:12px;color:#64748b;">{{email_greeting}},</p>
          <p class="name-text" style="margin:0 0 14px;font-size:16px;font-weight:700;color:#0f172a;">{{to_name}}</p>
          <p class="body-text" style="margin:0 0 18px;font-size:13px;color:#64748b;line-height:1.65;">{{email_body}}</p>
          <table class="otp-wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;background-color:#eff6ff;border-radius:14px;border:2px solid #3b82f6;">
            <tr>
              <td style="padding:20px 16px;text-align:center;">
                <p class="otp-lbl" style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:3px;color:#2563eb;text-transform:uppercase;">{{email_otp_label}}</p>
                <p class="otp-code" style="margin:0;font-family:'Courier New',monospace;font-size:38px;font-weight:900;color:#1e3a5f;letter-spacing:10px;">{{passcode}}</p>
              </td>
            </tr>
          </table>
          <table class="info-wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;background-color:#f1f5f9;border-radius:10px;border-left:3px solid #3b82f6;">
            <tr>
              <td style="padding:11px 14px;">
                <p class="info-text" style="margin:0;font-size:12px;color:#64748b;">⏱ {{email_expiry}} <strong class="info-time" style="color:#0f172a;"> {{time}}</strong></p>
              </td>
            </tr>
          </table>
          <table class="warn-wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border-radius:10px;border-left:3px solid #f59e0b;">
            <tr>
              <td style="padding:11px 14px;">
                <p class="warn-text" style="margin:0;font-size:12px;color:#92400e;">⚠️ {{email_warning}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="foot-bg" bgcolor="#f8fafc" style="background-color:#f8fafc;padding:14px 24px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#64748b;">{{email_footer_brand}}</p>
          <p style="margin:5px 0 0;font-size:10px;color:#94a3b8;">{{email_footer_auto}}</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`,
  deposit: `<!DOCTYPE html>
<html lang="{{lang}}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>{{email_subject}}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .card-body  { background-color: #1e293b !important; }
      .name-text  { color: #f1f5f9 !important; }
      .body-text  { color: #94a3b8 !important; }
      .amt-wrap   { background-color: #052e16 !important; border-color: #10b981 !important; }
      .amt-lbl    { color: #34d399 !important; }
      .amt-val    { color: #ffffff !important; }
      .amt-note   { color: #6ee7b7 !important; }
      .info-wrap  { background-color: #0d2d1a !important; border-left-color: #10b981 !important; }
      .info-text  { color: #86efac !important; }
      .info-time  { color: #4ade80 !important; }
      .warn-wrap  { background-color: #1c1a14 !important; border-left-color: #f59e0b !important; }
      .warn-text  { color: #d97706 !important; }
      .foot-bg    { background-color: transparent !important; border-top-color: #1e293b !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <div align="center" style="padding:40px 10px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:440px;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(0,0,0,0.05);">
      <tr>
        <td bgcolor="#052e16" style="background-color:#052e16;padding:24px 28px 20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:4px;color:#4ade80;text-transform:uppercase;">Nexus Option</p>
          <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;line-height:1.25;">{{email_title}}</h1>
          <p style="margin:5px 0 0;font-size:12px;color:#86efac;">{{email_subject}}</p>
        </td>
      </tr>
      <tr>
        <td class="card-body" bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 24px 20px;">
          <p class="body-text" style="margin:0 0 2px;font-size:12px;color:#64748b;">{{email_greeting}},</p>
          <p class="name-text" style="margin:0 0 14px;font-size:16px;font-weight:700;color:#0f172a;">{{to_name}}</p>
          <p class="body-text" style="margin:0 0 18px;font-size:13px;color:#64748b;line-height:1.65;">{{email_body}}</p>
          <table class="amt-wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;background-color:#f0fdf4;border-radius:14px;border:2px solid #16a34a;">
            <tr>
              <td style="padding:22px 16px;text-align:center;">
                <p class="amt-lbl" style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:3px;color:#15803d;text-transform:uppercase;">{{email_otp_label}}</p>
                <p class="amt-val" style="margin:0;font-size:42px;font-weight:900;color:#14532d;line-height:1.1;">{{passcode}}</p>
                <p class="amt-note" style="margin:8px 0 0;font-size:11px;color:#16a34a;font-weight:600;">{{email_credited}}</p>
              </td>
            </tr>
          </table>
          <table class="info-wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;background-color:#f0fdf4;border-radius:10px;border-left:3px solid #16a34a;">
            <tr>
              <td style="padding:11px 14px;">
                <p class="info-text" style="margin:0;font-size:12px;color:#166534;">🕐 {{email_expiry}}</p>
                <p class="info-time" style="margin:4px 0 0;font-size:11px;color:#15803d;font-weight:700;">{{time}}</p>
              </td>
            </tr>
          </table>
          <table class="warn-wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border-radius:10px;border-left:3px solid #f59e0b;">
            <tr>
              <td style="padding:11px 14px;">
                <p class="warn-text" style="margin:0;font-size:12px;color:#92400e;">⚠️ {{email_warning}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="foot-bg" bgcolor="#f8fafc" style="background-color:#f8fafc;padding:14px 24px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#64748b;">{{email_footer_brand}}</p>
          <p style="margin:5px 0 0;font-size:10px;color:#94a3b8;">{{email_footer_auto}}</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`,
  win: `<!DOCTYPE html>
<html lang="{{lang}}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>{{email_subject}}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .card-body  { background-color: #1e293b !important; }
      .name-text  { color: #f1f5f9 !important; }
      .body-text  { color: #94a3b8 !important; }
      .payout-box { background-color: #064e3b !important; border-color: #10b981 !important; }
      .payout-lbl { color: #34d399 !important; }
      .payout-val { color: #ffffff !important; }
      .payout-fin { color: #6ee7b7 !important; }
      .info-wrap  { background-color: #064e3b !important; border-left-color: #10b981 !important; }
      .info-text  { color: #6ee7b7 !important; }
      .info-time  { color: #34d399 !important; }
      .warn-wrap  { background-color: #1e293b !important; border-left-color: #f59e0b !important; }
      .warn-text  { color: #94a3b8 !important; }
      .foot-bg    { background-color: transparent !important; border-top-color: #1e293b !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <div align="center" style="padding:40px 10px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(0,0,0,0.05);">
      <tr>
        <td bgcolor="#052e16" style="background-color:#052e16;padding:32px 32px 24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:4px;color:#10b981;text-transform:uppercase;">Nexus Option</p>
          <h1 style="margin:0;font-size:32px;font-weight:900;color:#ffffff;line-height:1.1;">{{email_title}}</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#6ee7b7;">{{email_subject}}</p>
        </td>
      </tr>
      <tr>
        <td class="card-body" bgcolor="#ffffff" style="background-color:#ffffff;padding:32px;">
          <p class="body-text" style="margin:0 0 4px;font-size:14px;color:#64748b;">{{email_greeting}},</p>
          <p class="name-text" style="margin:0 0 20px;font-size:18px;font-weight:700;color:#1e293b;">{{to_name}} 🎉</p>
          <p class="body-text" style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;white-space:pre-line;">{{email_body}}</p>
          <table class="payout-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f0fdf4;border-radius:12px;border:2px solid #10b981;">
            <tr>
              <td style="padding:28px;text-align:center;">
                <p class="payout-lbl" style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:3px;color:#059669;text-transform:uppercase;">{{email_otp_label}}</p>
                <p class="payout-val" style="margin:0;font-size:46px;font-weight:900;color:#047857;line-height:1.1;">{{passcode}}</p>
                <p class="payout-fin" style="margin:10px 0 0;font-size:12px;color:#10b981;font-weight:700;">{{email_credited}} ✅</p>
              </td>
            </tr>
          </table>
          <table class="info-wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f8fafc;border-radius:10px;border-left:4px solid #10b981;">
            <tr>
              <td style="padding:16px;">
                <p class="info-text" style="margin:0;font-size:13px;color:#334155;font-weight:700;">{{email_expiry}}</p>
                <p class="info-time" style="margin:6px 0 0;font-size:12px;color:#10b981;">🕐 {{time}}</p>
              </td>
            </tr>
          </table>
          <table class="warn-wrap" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#fefce8;border-radius:10px;padding:16px;text-align:center;">
                <p class="warn-text" style="margin:0;font-size:13px;color:#854d0e;">{{email_warning}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="foot-bg" bgcolor="#f8fafc" style="background-color:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#64748b;">{{email_footer_brand}}</p>
          <p style="margin:8px 0 0;font-size:10px;color:#94a3b8;">{{email_footer_auto}}</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`
};

serve(async (req) => {
  console.log(`[Send-Email] Received request: ${req.method} ${req.url}`);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, type, data, lang = "en" } = (await req.json());

    if (!BREVO_API_KEY) throw new Error("Missing BREVO_API_KEY");

    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const templateKey = type as keyof typeof TEMPLATES;
    let template = TEMPLATES[templateKey];
    if (!template) throw new Error("Invalid email type: " + type);

    // Determine derived variables
    let subject = "";
    let emailTitle = "";
    let emailSubjectSub = "";
    let emailBody = "";
    let otpLabel = "";
    let otpValue = "";
    let emailExpiry = "";
    let emailWarning = "— Nexus Option Team";
    let emailCredited = "";

    const isTh = (l: string) => l === 'th';

    if (type === "otp") {
      const otpType = data.type || "verification";
      
      if (otpType === "reset") {
        subject = isTh(lang) ? "กู้คืนรหัสผ่าน Nexus Option" : "Nexus Option Password Reset";
        emailBody = isTh(lang) ? "โปรดใช้รหัสยืนยัน (OTP) ด้านล่างเพื่อตั้งรหัสผ่านใหม่ของคุณ" : "Please use the following OTP to reset your password.";
      } else if (otpType === "change_email") {
        subject = isTh(lang) ? "ยืนยันการเปลี่ยนอีเมล Nexus Option" : "Nexus Option Email Change Verification";
        emailBody = isTh(lang) ? "โปรดใช้รหัสยืนยัน (OTP) ด้านล่างเพื่อยืนยันการเปลี่ยนอีเมลใหม่ของคุณ" : "Please use the following OTP to verify your new email address.";
      } else {
        subject = isTh(lang) ? "ยืนยันตนสมาชิกใหม่ Nexus Option" : "New Member Verification Nexus Option";
        emailBody = isTh(lang) ? "โปรดใช้รหัสยืนยัน (OTP) ด้านล่างเพื่อเปิดใช้งานบัญชีสมาชิกใหม่ของคุณ" : "Please use the following OTP to activate your new member account.";
      }

      emailTitle = subject;
      emailSubjectSub = subject;
      otpLabel = t.otp_label;
      otpValue = data.code;
      emailExpiry = t.expiry;
      emailWarning = t.warning;
    } else if (type === "deposit") {
      subject = t.deposit_subject;
      emailTitle = isTh(lang) ? "ฝากเงินสำเร็จ" : "Deposit Success";
      emailSubjectSub = subject;
      emailBody = t.deposit_body;
      otpLabel = t.deposit_label;
      otpValue = "$" + Number(data.amount).toLocaleString();
      emailExpiry = t.deposit_warning;
      emailCredited = t.credited_note;
    } else if (type === "win") {
      const orderIdShort = data.orderId ? data.orderId.slice(-4).toUpperCase() : "TRADE";
      subject = t.win_subject + " (ID: #" + orderIdShort + ")";
      emailTitle = t.win_title;
      emailSubjectSub = subject;
      
      const directionLabel = data.direction === 'up' ? t.up : t.down;
      const formattedStake = "$" + Number(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
      const formattedPayout = "$" + Number(data.payout).toLocaleString(undefined, { minimumFractionDigits: 2 });
      const formattedProfit = "$" + (Number(data.payout) - Number(data.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 });

      const details = t.trade_details + "\n" +
        "• " + t.order_id + ": #" + orderIdShort + "\n" + 
        "• " + t.asset + ": " + data.assetSymbol + "\n" + 
        "• " + t.direction + ": " + directionLabel + "\n" + 
        "• " + t.payout_rate + ": " + (data.payoutPercent ?? '—') + "%\n" + 
        "• " + t.stake + ": " + formattedStake + "\n" + 
        "• " + t.net_profit + ": " + formattedProfit;

      emailBody = t.win_body + "\n\n" + details;
      otpLabel = t.win_label;
      otpValue = formattedPayout;
      emailExpiry = t.win_warning;
      emailCredited = t.credited_note;
    }

    const timeStr = data.time || new Date().toLocaleString(lang === 'th' ? 'th-TH' : 'en-US');
    const toName = data.userName || (isTh(lang) ? "ลูกค้า" : "Customer");

    // Replace placeholders
    const finalHtml = template
      .replace(/{{lang}}/g, lang)
      .replace(/{{email_subject}}/g, subject)
      .replace(/{{email_title}}/g, emailTitle)
      .replace(/{{email_greeting}}/g, t.greeting)
      .replace(/{{to_name}}/g, toName)
      .replace(/{{email_body}}/g, emailBody)
      .replace(/{{email_otp_label}}/g, otpLabel)
      .replace(/{{passcode}}/g, otpValue)
      .replace(/{{email_expiry}}/g, emailExpiry)
      .replace(/{{time}}/g, timeStr)
      .replace(/{{email_warning}}/g, emailWarning)
      .replace(/{{email_credited}}/g, emailCredited)
      .replace(/{{email_footer_brand}}/g, t.footer_brand)
      .replace(/{{email_footer_auto}}/g, t.footer_auto);

    // Debug logs
    console.log(`[Send-Email] Attempting to send to: ${to}`);
    console.log(`[Send-Email] Using sender: ${SENDER_EMAIL}`);
    console.log(`[Send-Email] API Key prefix: ${BREVO_API_KEY?.substring(0, 10)}...`);

    // Call Brevo API
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY as string,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: finalHtml,
      }),
    });

    const resData = await res.json();
    console.log(`[Send-Email] Brevo Response Status: ${res.status}`);
    console.log(`[Send-Email] Brevo Response Data:`, JSON.stringify(resData));

    return new Response(JSON.stringify(resData), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`[Send-Email] CRITICAL ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
