import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "https://esm.sh/web-push@3.6.7";

declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const VAPID_PUBLIC_KEY = Deno.env.get("VITE_VAPID_PUBLIC_KEY") ?? Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: PushPayload = await req.json();
    const { userId, title, body, icon, url } = payload;

    if (!userId || !title) {
      return new Response(JSON.stringify({ error: "Missing required fields (userId, title)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("VAPID keys not configured in environment Variables.");
      return new Response(JSON.stringify({ error: "Push Notification Server Not Configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Web Push
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    // Fetch all push subscriptions for this user
    const { data: subscriptions, error: dbErr } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", userId);

    if (dbErr) {
      throw new Error(`Database Error: ${dbErr.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "User has no push subscriptions. Skipped." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pushMessage = JSON.stringify({
      title,
      body,
      icon: icon || "/logo192.png",
      data: {
        url: url || "/"
      }
    });

    let successCount = 0;
    let failureCount = 0;
    const staleIds: string[] = [];

    // Send push notification to all stored devices concurrently
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, pushMessage);
        successCount++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription is dead (user revoked, expired, etc.)
          staleIds.push(sub.id);
        }
        console.error(`Failed to push to sub ${sub.id}:`, err);
        failureCount++;
      }
    });

    await Promise.all(promises);

    // Clean up stale subscriptions from the database
    if (staleIds.length > 0) {
      console.log(`Cleaning up ${staleIds.length} stale subscriptions...`);
      await supabase.from("push_subscriptions").delete().in("id", staleIds);
    }

    return new Response(
      JSON.stringify({
        message: "Push notification job completed",
        successCount,
        failureCount,
        staleCleaned: staleIds.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("send-web-push error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
