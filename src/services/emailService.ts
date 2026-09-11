import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabase';
import type { EmailProvider } from '../types';

/**
 * SERVICE: Email Service (with Pooling & Auto-Failover)
 * Handles sending emails using a pool of EmailJS accounts.
 * If one provider fails (limit reached/error), it automatically switches to the next one.
 */

// Fallbacks from .env (in case pool is empty)
const FB_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_svw562h';
const FB_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'ZAVZJUcl_O9sey-Da';
const FB_TEMPLATE_WIN = import.meta.env.VITE_EMAILJS_TEMPLATE_WIN || 'template_dmuhb44';
const FB_TEMPLATE_OTP = import.meta.env.VITE_EMAILJS_TEMPLATE_OTP || 'template_k27navk';

interface SendOptions {
  email: string;
  code: string;
  userName?: string;
  lang?: "th" | "en";
  type?: 'verification' | 'reset' | 'change_email';
}

interface NotifyWinOptions {
  email: string;
  userName: string;
  amount: number;
  payout: number;
  assetSymbol: string;
  orderId?: string;
  direction?: 'up' | 'down';
  durationMinutes?: number;
  payoutPercent?: number;
  lang?: "th" | "en";
}

/**
 * Resets all provider sent counts if a new month has started.
 */
const checkMonthlyReset = async () => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { data: settings, error: fetchError } = await supabase
      .from('global_settings')
      .select('last_email_reset_month')
      .eq('id', 'main')
      .single();

    if (fetchError || !settings) return;

    if (settings.last_email_reset_month !== currentMonth) {
      console.log(`[EmailService] New month detected (${currentMonth}). Resetting sent counts...`);
      
      // Reset all providers
      const { error: resetError } = await supabase
        .from('email_providers')
        .update({ sent_count: 0 });

      if (resetError) throw resetError;

      // Update last reset month
      await supabase
        .from('global_settings')
        .update({ last_email_reset_month: currentMonth })
        .eq('id', 'main');
    }
  } catch (err) {
    console.error('[EmailService] Monthly reset check failed:', err);
  }
};

/**
 * Fetch active providers from the pool, sorted by priority and last usage.
 */
const getActiveProviders = async (): Promise<Partial<EmailProvider>[]> => {
  await checkMonthlyReset();
  try {
    const { data, error } = await supabase
      .from('email_providers')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('last_used_at', { ascending: true });
    
    if (error || !data || data.length === 0) {
      console.warn('[EmailService] No active providers in pool, using fallback config');
      return [{
        public_key: FB_PUBLIC_KEY,
        service_id: FB_SERVICE_ID,
        template_otp: FB_TEMPLATE_OTP,
        template_win: FB_TEMPLATE_WIN
      }];
    }
    return data;
  } catch (err) {
    console.error('[EmailService] Pool fetch error:', err);
    return [{
      public_key: FB_PUBLIC_KEY,
      service_id: FB_SERVICE_ID,
      template_otp: FB_TEMPLATE_OTP,
      template_win: FB_TEMPLATE_WIN
    }];
  }
};

/**
 * Mark a provider as used or update error count
 */
const updateProviderStats = async (id: string | undefined, success: boolean) => {
  if (!id) return;
  try {
    const updates: any = { last_used_at: new Date().toISOString() };
    
    // Fetch current stats to increment
    const { data: current } = await supabase
      .from('email_providers')
      .select('error_count, sent_count')
      .eq('id', id)
      .single();

    if (!success) {
      updates.error_count = (current?.error_count || 0) + 1;
    } else {
      updates.sent_count = (current?.sent_count || 0) + 1;
    }
    
    await supabase.from('email_providers').update(updates).eq('id', id);
  } catch (err) {
    console.warn('[EmailService] Failed to update provider stats:', err);
  }
};

export const emailService = {
  /**
   * Sends a 6-digit OTP with Auto-Failover.
   */
  sendOTP: async (options: SendOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    const { email, code, lang = "en", userName } = options;
    const providers = await getActiveProviders();
    let lastError = "No providers available";

    console.log(`[EmailService] Attempting to send OTP to ${email} (Pool size: ${providers.length})`);

    for (const provider of providers) {
      try {
        const isTh = lang === 'th';
        const result = await emailjs.send(
          provider.service_id!,
          provider.template_otp!,
          {
            to_email: email,
            to_name: userName || email.split('@')[0],
            passcode: code,
            email_title: isTh ? "รหัสยืนยันตัวตน" : "Verification Code",
            email_subject: isTh ? "ยืนยันบัญชีของคุณ" : "Verify your account",
            email_greeting: isTh ? "สวัสดี" : "Hi",
            email_body: isTh 
              ? "กรุณาใช้รหัสต่อไปนี้เพื่อยืนยันตัวตนในระบบ Nexus Option" 
              : "Please use the following code to verify your identity on Nexus Option.",
            email_otp_label: isTh ? "รหัสยืนยัน (OTP)" : "Verification Code",
            email_expiry: isTh ? "มีอายุการใช้งาน" : "Valid for",
            time: isTh ? "10 นาที" : "10 minutes",
            email_warning: isTh 
              ? "หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้" 
              : "If you didn't request this, please ignore this email.",
            email_footer_brand: "Nexus Option",
            email_footer_auto: isTh ? "ข้อความอัตโนมัติ กรุณาอย่าตอบกลับ" : "Automated message, please do not reply."
          },
          provider.public_key!
        );

        await updateProviderStats(provider.id, true);
        console.log(`[EmailService] OTP Sent successfully using provider: ${provider.name || 'Fallback'}`);
        return { success: true, data: result };
      } catch (err: any) {
        console.error(`[EmailService] Provider ${provider.name || 'Fallback'} failed:`, err);
        lastError = err.text || err.message;
        await updateProviderStats(provider.id, false);
        // Continue to next provider...
      }
    }

    return { success: false, error: `All providers failed. Last error: ${lastError}` };
  },

  /**
   * Sends a win celebration with Auto-Failover.
   */
  sendWinNotification: async (options: NotifyWinOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    const { email, userName, payout, assetSymbol, lang = "en" } = options;
    const providers = await getActiveProviders();
    let lastError = "No providers available";

    console.log(`[EmailService] Attempting to send Win Notification to ${email} (Pool size: ${providers.length})`);

    for (const provider of providers) {
      try {
        const isTh = lang === 'th';
        const result = await emailjs.send(
          provider.service_id!,
          provider.template_win!,
          {
            to_email: email,
            to_name: userName,
            passcode: payout.toLocaleString(),
            email_title: isTh ? "คุณชนะแล้ว!" : "YOU WON!",
            email_subject: isTh ? "ยินดีด้วยกับกำไรของคุณ!" : "Congratulations on your profit!",
            email_greeting: isTh ? "ขอแสดงความยินดี" : "Congratulations",
            email_body: isTh 
              ? `การเทรด ${assetSymbol} ของคุณประสบความสำเร็จ!` 
              : `Your trade for ${assetSymbol} was successful!`,
            email_otp_label: isTh ? "กำไรที่ได้รับ" : "PROFIT EARNED",
            email_credited: isTh ? "เติมเข้ากระเป๋าเงินแล้ว" : "Credited to your balance",
            email_expiry: isTh ? "สินทรัพย์ที่เทรด" : "Asset Traded",
            time: assetSymbol,
            email_warning: isTh 
              ? "คุณสามารถเริ่มเทรดต่อได้ทันทีเพื่อรับกำไรที่มากขึ้น" 
              : "You can start trading again now to earn more profits.",
            email_footer_brand: "Nexus Option",
            email_footer_auto: isTh ? "ข้อความอัตโนมัติ กรุณาอย่าตอบกลับ" : "Automated message, please do not reply."
          },
          provider.public_key!
        );

        await updateProviderStats(provider.id, true);
        console.log(`[EmailService] Win Notification Sent successfully using provider: ${provider.name || 'Fallback'}`);
        return { success: true, data: result };
      } catch (err: any) {
        console.error(`[EmailService] Provider ${provider.name || 'Fallback'} failed:`, err);
        lastError = err.text || err.message;
        await updateProviderStats(provider.id, false);
      }
    }

    return { success: false, error: `All providers failed. Last error: ${lastError}` };
  },

  sendDepositNotification: async (_options: any) => ({ success: false, error: "Not implemented" }),
  sendWithdrawNotification: async (_options: any) => ({ success: false, error: "Not implemented" })
};
