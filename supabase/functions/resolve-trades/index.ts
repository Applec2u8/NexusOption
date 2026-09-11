import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Declare Deno to prevent TypeScript errors in the editor (since this is a Deno environment)
declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TRANSLATIONS: Record<string, any> = {
  th: {
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
    order_id: "เลขที่บิล / Order ID",
    greeting: "สวัสดีครับคุณ"
  },
  en: {
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
    order_id: "Order ID",
    greeting: "Hello"
  }
};

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (response.ok) {
      const data = await response.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price && price > 0) {
        console.log(`[PriceFetch] Yahoo Finance Match (${symbol}): ${price}`);
        return price;
      }
    }
  } catch (err) {
    console.warn(`[PriceFetch] Yahoo Finance error for ${symbol}:`, err.message);
  }
  return null;
}

async function fetchPrice(symbol: string): Promise<number | null> {
  const upperSymbol = symbol.toUpperCase();
  console.log(`[PriceFetch] Starting dynamic waterfall fetch for: ${upperSymbol}`);

  // 1. Static/Hardcoded logic
  if (upperSymbol === "USDT" || upperSymbol === "USDC") return 1.0;

  // 2. Try Gold API
  if (upperSymbol === "GOLD" || upperSymbol === "XAU") {
    try {
      const response = await fetch(`https://api.gold-api.com/price/XAU`);
      if (response.ok) {
        const data = await response.json();
        return data.price;
      }
    } catch (err) {
      console.warn(`[PriceFetch] Gold API skip:`, err.message);
    }
  }

  // 3. Try Binance API (Crypto)
  try {
    const binanceSymbol = upperSymbol === "BTC" ? "BTCUSDT" : `${upperSymbol}USDT`;
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
    if (response.ok) {
      const data = await response.json();
      return parseFloat(data.price);
    }
  } catch (err) {
    console.warn(`[PriceFetch] Binance skip for ${upperSymbol}:`, err.message);
  }

  // 4. Try Yahoo Finance (Free Stock Fallback)
  const yahooPrice = await fetchYahooPrice(upperSymbol);
  if (yahooPrice) return yahooPrice;

  // 5. Try Finnhub API (Requires Key)
  if (FINNHUB_API_KEY && FINNHUB_API_KEY !== "YOUR_KEY_HERE") {
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${upperSymbol}&token=${FINNHUB_API_KEY}`);
      if (response.ok) {
        const data = await response.json();
        if (data.c && data.c > 0) return data.c;
      }
    } catch (err) {
      console.error(`[PriceFetch] Finnhub error for ${upperSymbol}:`, err.message);
    }
  }

  console.error(`[PriceFetch] CRITICAL FAIL: No price sources available for ${upperSymbol}`);
  return null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  async function sendWinEmail(trade: any, profile: any) {
    const email = profile?.email;
    if (!email) return;

    try {
      console.log(`Invoking send-email function for ${email}...`);
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          type: "win",
          lang: profile?.language || "en",
          data: {
            userName: profile?.first_name 
              ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
              : 'Trader',
            amount: trade.amount,
            payout: trade.amount + (trade.amount * trade.payout_percent) / 100,
            assetSymbol: trade.asset_symbol,
            orderId: trade.id,
            direction: trade.type,
            payoutPercent: trade.payout_percent
          }
        }
      });

      if (error) {
        console.error(`Failed to invoke send-email for ${trade.id}:`, error);
      } else {
        console.log(`✅ Win email successfully requested for ${trade.id}`);
      }
    } catch (err) {
      console.error(`🚨 Error requesting win email for ${trade.id}:`, err);
    }
  }

  async function sendWinPush(trade: any, profile: any) {
    try {
      const lang = profile?.language || "en";
      const t = TRANSLATIONS[lang] || TRANSLATIONS["en"];
      
      const payout = trade.amount + (trade.amount * trade.payout_percent) / 100;
      const formattedPayout = `+$${payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      
      const title = t.win_title || "Congratulations!";
      const body = `${t.asset || 'Asset'} ${trade.asset_symbol} ${t.win_label || 'Payout received'}: ${formattedPayout}`;

      console.log(`Invoking send-web-push function for user ${trade.user_id}...`);
      const { error } = await supabase.functions.invoke("send-web-push", {
        body: {
          userId: trade.user_id,
          title,
          body,
          url: "/history"
        }
      });

      if (error) {
        console.error(`Failed to invoke send-web-push for ${trade.id}:`, error);
      } else {
        console.log(`✅ Web Push successfully requested for ${trade.id}`);
      }
    } catch (err) {
      console.error(`🚨 Error requesting web push for ${trade.id}:`, err);
    }
  }

  try {
    const now = Date.now();
    console.log(`[${new Date().toISOString()}] Starting trade resolution...`);
    // 1. Fetch pending trades that have expired with user trade_control setting
    const { data: expiredTrades, error: fetchErr } = await supabase
      .from("binary_trades")
      .select("*, profiles:user_id(trade_control)")
      .eq("status", "pending")
      .lte("expiry_time", now);
      
    if (fetchErr) throw fetchErr;
    
    if (!expiredTrades || expiredTrades.length === 0) {
      return new Response(JSON.stringify({ message: "No expired trades to process." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`FOUND ${expiredTrades.length} expired trades. Processing...`);
    let processedCount = 0;

    for (const trade of expiredTrades) {
      const currentPrice = await fetchPrice(trade.asset_symbol);
      
      // Robust profile data retrieval (handles both object and array from Supabase join)
      const profileData = Array.isArray(trade.profiles) ? trade.profiles[0] : trade.profiles;
      const tradeControl = profileData?.trade_control || 'normal';
      
      console.log(`Processing Trade ${trade.id} for user ${trade.user_id}. Strategy: ${tradeControl}`);
      
      if (currentPrice === null) {
        // ... (refund logic remains the same)
        const expiredMinutes = (now - Number(trade.expiry_time)) / 60000;
        if (expiredMinutes > 5) {
          console.log(`Trade ${trade.id} has been expired for ${Math.round(expiredMinutes)} min but price is still null. Refunding to protect user funds.`);
          const { data: refundRes, error: refundErr } = await supabase.rpc('refund_binary_trade', {
            p_trade_id: trade.id
          });
          if (refundErr) console.error(`Failed to refund trade ${trade.id}:`, refundErr);
          else console.log(`✅ Trade ${trade.id} refunded successfully.`);
        } else {
          console.warn(`Could not fetch price for ${trade.asset_symbol}, will retry in next cycle.`);
        }
        continue;
      }
      
      let won = false;

      // --- TRADE CONTROL LOGIC ---
      if (tradeControl === 'always_win') {
        won = true;
        console.log(`[Control] Trade ${trade.id} forced WIN (always_win)`);
      } else if (tradeControl === 'always_loss') {
        won = false;
        console.log(`[Control] Trade ${trade.id} forced LOSS (always_loss)`);
      } else if (tradeControl === 'low_win_rate') {
        won = Math.random() < 0.15; // 15% win rate
        console.log(`[Control] Trade ${trade.id} randomized with low_win_rate (Outcome: ${won ? 'WIN' : 'LOSS'})`);
      } else {
        // Normal Market Price Logic
        if (trade.type === "up" && currentPrice > trade.entry_price) won = true;
        if (trade.type === "down" && currentPrice < trade.entry_price) won = true;
        console.log(`[Normal] Trade ${trade.id} resolved via Market Price: ${currentPrice} (Entry: ${trade.entry_price}, Outcome: ${won ? 'WIN' : 'LOSS'})`);
      }

      const payout = won
        ? trade.amount + (trade.amount * trade.payout_percent) / 100
        : 0;
      const tradeStatus = won ? "won" : "lost";

      // 2. Call RPC to settle securely
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('resolve_binary_trade', {
        p_trade_id: trade.id,
        p_new_status: tradeStatus,
        p_result_price: currentPrice,
        p_payout_amount: payout
      });

      if (rpcErr || !rpcRes?.success) {
        console.error(`Failed to resolve trade ${trade.id}:`, rpcErr || rpcRes);
        continue;
      }

      processedCount++;

      // 3. Send email if Won
      if (won) {
        console.log(`Trade ${trade.id} WON! Preparing to send email...`);
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("email, first_name, last_name, id, language") 
          .eq("id", trade.user_id)
          .single();
          
        if (profileErr) console.warn(`Profile fetch error/warning: ${profileErr.message}`);
          
        let targetProfile = profile;
        if (!targetProfile?.email) {
            console.log(`Profile email missing, checking auth data...`);
            // Also need to fetch user auth email if missing
            const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(trade.user_id);
            if (authErr) console.error(`Auth data fetch error: ${authErr.message}`);
            
            if (authData?.user) {
              targetProfile = { ...targetProfile, email: authData.user.email };
            }
        }
        
        if (targetProfile?.email) {
          console.log(`Found email address: ${targetProfile.email}. Sending win notification email...`);
          await sendWinEmail(trade, targetProfile);
        } else {
          console.error(`Cannot send email for ${trade.id}: No email address found for user ${trade.user_id}`);
        }
        
        // Also send Web Push Notification
        await sendWinPush(trade, targetProfile);
      } else {
        console.log(`Trade ${trade.id} LOST. Skipping email.`);
      }
    }

    console.log(`Done. Successfully processed ${processedCount} trades.`);

    return new Response(
      JSON.stringify({ message: `Successfully processed ${processedCount} trades.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge function fatal error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
