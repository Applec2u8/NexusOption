import { supabase } from '../lib/supabase';

export type ActivityType = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'win' | 'loss' | 'login';

export interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  email: string;
  type: ActivityType;
  description: string;
  amount?: number;
  asset?: string;
  device?: string;
  ip?: string;
  createdAt: string;
  ticketId?: string;
  sessionId?: string; // Links login history to an active session
  isActive?: boolean; // True if this login is still active
}

export interface ActivityFilters {
  startDate?: string; // ISO date string YYYY-MM-DD
  endDate?: string;
  type?: ActivityType | 'all';
  userId?: string;
}

export const activityService = {
  async fetchActivities(filters: ActivityFilters = {}): Promise<ActivityItem[]> {
    const { startDate, endDate, type, userId } = filters;

    const startISO = startDate ? `${startDate}T00:00:00.000Z` : undefined;
    const endISO   = endDate   ? `${endDate}T23:59:59.999Z`   : undefined;

    const results: ActivityItem[] = [];

    // ─── 0. Active Sessions (Map for login linkage) ───────────
    const { data: activeSessions } = await supabase
      .from('user_sessions')
      .select('id, user_id, device_name, os_name, browser_name, ip_address');
    
    const sessionMap = new Map<string, any>();
    activeSessions?.forEach((s: any) => {
      // Key format: userId | device | browser | os | ip
      const key = `${s.user_id}|${s.device_name}|${s.browser_name}|${s.os_name}|${s.ip_address}`;
      sessionMap.set(key, s.id);
    });

    // ─── 1. Transactions ───────────────────────────────────────
    const shouldFetchTx = !type || type === 'all' ||
      ['deposit', 'withdraw', 'buy', 'sell', 'win', 'loss'].includes(type);

    if (shouldFetchTx) {
      let txQuery = supabase
        .from('transactions')
        .select('id, user_id, type, asset_symbol, amount, total, status, binary_trade_id, created_at, profiles(username, email)')
        .order('created_at', { ascending: false });

      if (type && type !== 'all') txQuery = txQuery.eq('type', type);
      if (userId)   txQuery = txQuery.eq('user_id', userId);
      if (startISO) txQuery = txQuery.gte('created_at', startISO);
      if (endISO)   txQuery = txQuery.lte('created_at', endISO);

      const { data: txData } = await txQuery;

      if (txData) {
        txData.forEach((tx: any) => {
          const profile = Array.isArray(tx.profiles) ? tx.profiles[0] : tx.profiles;
          const ticketId = (tx.binary_trade_id || tx.id).slice(-4).toUpperCase();

          results.push({
            id:          `tx-${tx.id}`,
            userId:      tx.user_id,
            username:    profile?.username ?? '—',
            email:       profile?.email    ?? '—',
            type:        tx.type as ActivityType,
            description: buildTxDescription(tx.type, tx.asset_symbol, tx.total),
            amount:      tx.total,
            asset:       tx.asset_symbol,
            createdAt:   tx.created_at,
            ticketId:    ticketId
          });
        });
      }
    }

    // ─── 2. Login History ──────────────────────────────────────
    const shouldFetchLogin = !type || type === 'all' || type === 'login';

    if (shouldFetchLogin) {
      let lhQuery = supabase
        .from('user_login_history')
        .select('id, user_id, device_name, browser_name, os_name, ip_address, created_at, profiles(username, email)')
        .order('created_at', { ascending: false });

      if (userId)   lhQuery = lhQuery.eq('user_id', userId);
      if (startISO) lhQuery = lhQuery.gte('created_at', startISO);
      if (endISO)   lhQuery = lhQuery.lte('created_at', endISO);

      const { data: lhData } = await lhQuery;

      if (lhData) {
        lhData.forEach((lh: any) => {
          const profile = Array.isArray(lh.profiles) ? lh.profiles[0] : lh.profiles;
          
          // Try to link to an active session
          const sessionKey = `${lh.user_id}|${lh.device_name}|${lh.browser_name}|${lh.os_name}|${lh.ip_address}`;
          const activeSessionId = sessionMap.get(sessionKey);

          results.push({
            id:          `lh-${lh.id}`,
            userId:      lh.user_id,
            username:    profile?.username ?? '—',
            email:       profile?.email    ?? '—',
            type:        'login',
            description: `เข้าสู่ระบบ`,
            device:      [lh.browser_name, lh.os_name, lh.device_name].filter(Boolean).join(' · '),
            ip:          lh.ip_address ?? '—',
            createdAt:   lh.created_at,
            sessionId:   activeSessionId,
            isActive:    !!activeSessionId
          });
        });
      }
    }

    results.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return results;
  },

  async kickSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      console.error("kickSession error:", error);
      throw error;
    }
    return true;
  },

  async fetchUserList(): Promise<{ id: string; username: string; email: string }[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email')
      .order('username');
    return data ?? [];
  },

  async deleteActivity(activityId: string): Promise<boolean> {
    const realId = activityId.startsWith('lh-') || activityId.startsWith('tx-')
      ? activityId.slice(3)
      : activityId;
    const table = activityId.startsWith('tx-') ? 'transactions' : 'user_login_history';
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', realId);
    
    if (error) {
       console.error("deleteActivity error:", error);
       throw error;
    }
    return true;
  },

  async clearLoginHistory(userId: string, currentSessionId?: string): Promise<boolean> {
    if (currentSessionId) {
      // Get the current session to identify its properties
      const { data: currentSession } = await supabase
        .from('user_sessions')
        .select('device_name, os_name, browser_name, ip_address')
        .eq('id', currentSessionId)
        .single();

      if (currentSession) {
        // Get all login histories for the user
        const { data: histories } = await supabase
          .from('user_login_history')
          .select('id, device_name, os_name, browser_name, ip_address')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (histories && histories.length > 0) {
          // Find the most recent history that matches the current session's signature
          const matchingHistory = histories.find((h: any) => 
            h.device_name === currentSession.device_name &&
            h.os_name === currentSession.os_name &&
            h.browser_name === currentSession.browser_name &&
            h.ip_address === currentSession.ip_address
          );

          let query = supabase.from('user_login_history').delete().eq('user_id', userId);
          if (matchingHistory) {
            query = query.neq('id', matchingHistory.id);
          }
          
          const { error } = await query;
          if (error) {
             console.error("clearLoginHistory error:", error);
             throw error;
          }
          return true;
        }
      }
    }

    // Default behavior if no session ID or session not found
    const { error } = await supabase
      .from('user_login_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
       console.error("clearLoginHistory error:", error);
       throw error;
    }
    return true;
  },

  async kickAllOtherSessions(userId: string, currentSessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .neq('id', currentSessionId);
    
    if (error) {
       console.error("kickAllOtherSessions error:", error);
       throw error;
    }
    return true;
  },
};

function buildTxDescription(type: string, asset: string, total: number): string {
  const amt = `$${Number(total).toLocaleString()}`;
  switch (type) {
    case 'deposit':  return `ฝากเงิน ${amt}`;
    case 'withdraw': return `ถอนเงิน ${amt}`;
    case 'buy':      return `ซื้อ ${asset} ${amt}`;
    case 'sell':     return `ขาย ${asset} ${amt}`;
    case 'win':      return `ชนะเทรด ${asset} +${amt}`;
    case 'loss':     return `แพ้เทรด ${asset} -${amt}`;
    default:         return `${type} ${amt}`;
  }
}
