import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

export interface Transaction {
  id: string;
  type: "buy" | "sell" | "deposit" | "withdraw" | "win" | "loss" | "refund-marker";
  asset: string;
  amount: number;
  price: number;
  total: number;
  timestamp: string;
  status: "success" | "pending" | "failed";
  binary_type?: "up" | "down";
  binary_result?: "win" | "loss" | "Refunded";
  trade_id?: string;
  smart_id?: string;
  is_win?: boolean;
  is_loss?: boolean;
  description?: string;
}
export interface BinaryTrade {
  id: string;
  type: "up" | "down";
  assetSymbol: string;
  amount: number;
  entryPrice: number;
  payoutPercent: number;
  startTime: number;
  expiryTime: number;
  status: "active" | "won" | "lost" | "pending";
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  portfolio: Record<string, number>;
  loading: boolean;
  activeBinaryTrades: BinaryTrade[];
  totalDeposited: number;
  tierThresholds: {
    tier_1m: number;
    tier_3m: number;
    tier_5m: number;
    tier_15m: number;
    tier_20m: number;
    tier_30m: number;
  };
  handleTrade: (
    type: "buy" | "sell",
    asset: any,
    amountUSD: number,
  ) => Promise<{ success: boolean; message: string }>;
  createBinaryTrade: (
    type: "up" | "down",
    asset: any,
    amountUSD: number,
    durationMinutes: number,
    payoutPercent: number,
  ) => Promise<{ success: boolean; message: string }>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<boolean>;
  refreshWallet: () => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  hasMoreTransactions: boolean;
  loadingMore: boolean;
}



const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeBinaryTrades, setActiveBinaryTrades] = useState<BinaryTrade[]>([]);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [tierThresholds, setTierThresholds] = useState({
    tier_1m: 0,
    tier_3m: 500,
    tier_5m: 1000,
    tier_15m: 2500,
    tier_20m: 5000,
    tier_30m: 10000,
  });
  const processingTradeIds = useRef<Set<string>>(new Set());
  const hasReconciled = useRef(false);

  // Sync internal balance and totalDeposited with profile when it loads
  useEffect(() => {
    if (profile) {
      setBalance(Number(profile.balance));
      setTotalDeposited(Number(profile.total_deposited ?? 0));
    }
  }, [profile]);

  // Load tier thresholds from global_settings once on mount
  useEffect(() => {
    const loadTierThresholds = async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("tier_1m_threshold, tier_3m_threshold, tier_5m_threshold, tier_15m_threshold, tier_20m_threshold, tier_30m_threshold")
        .eq("id", "main")
        .single();
      if (!error && data) {
        setTierThresholds({
          tier_1m: data.tier_1m_threshold ?? 0,
          tier_3m: data.tier_3m_threshold ?? 500,
          tier_5m: data.tier_5m_threshold ?? 1000,
          tier_15m: data.tier_15m_threshold ?? 2500,
          tier_20m: data.tier_20m_threshold ?? 5000,
          tier_30m: data.tier_30m_threshold ?? 10000,
        });
      }
    };
    loadTierThresholds();
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    
    try {
      // Load transactions (limit to 100 for better history)
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (txError) {
        console.error(
          "[WalletContext] Error loading transactions:",
          txError.message,
        );
      } else {
        setHasMoreTransactions(txData.length === 100);
        
        // --- SMART LINKING ALGORITHM ---
        // We process transactions chronologically to pair results with their original stakes.
        
        // 1. Initial mapping and sort oldest to newest
        const processed = (txData ?? []).map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          asset: tx.asset_symbol,
          amount: Number(tx.amount),
          price: Number(tx.price),
          total: Number(tx.total),
          timestamp: tx.created_at,
          status: tx.status,
          binary_type: tx.binary_type,
          binary_result: tx.binary_result,
          trade_id: tx.binary_trade_id || tx.reference_id || tx.id,
          smart_id: (tx.binary_trade_id || tx.id).slice(-4).toUpperCase(), 
          description: tx.description,
        }) as Transaction).sort((a: Transaction, b: Transaction) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // 2. Direct Linking & Map of "open" trade Ticket IDs
        const openStacks: Record<string, string[]> = {};
        const tradeIdToSmartId: Record<string, string> = {};

        // 3. Sequential Pairing (Prioritize Direct ID > then FIFO fallback)
        const idMap: Record<string, Transaction> = {};
        processed.forEach((tx: Transaction) => {
          if (tx.smart_id) idMap[tx.smart_id] = tx;
        });

        processed.forEach((tx: Transaction) => {
          const isStake = (tx.type === 'buy' || tx.type === 'sell') && tx.binary_type && !tx.binary_result;
          const isResult = tx.type === 'win' || tx.type === 'loss' || (tx.type === 'deposit' && tx.trade_id && tradeIdToSmartId[tx.trade_id]);

          if (isStake) {
            const tid = (tx.trade_id || tx.id).slice(-4).toUpperCase();
            tx.smart_id = tid;
            idMap[tid] = tx;
            
            // Map the direct binary_trade_id to this smart_id for future results
            if (tx.trade_id) tradeIdToSmartId[tx.trade_id] = tid;
            
            // Still push to stack for FIFO fallback in case direct ID is missing
            const key = `${tx.asset}-${tx.binary_type}`;
            if (!openStacks[key]) openStacks[key] = [];
            openStacks[key].push(tid);
          } else if (isResult || tx.binary_type) {
            // Result found:
            // a. Try Direct Link first
            if (tx.trade_id && tradeIdToSmartId[tx.trade_id]) {
              tx.smart_id = tradeIdToSmartId[tx.trade_id];
            } 
            // b. Fallback to FIFO stack (only if binary_type is present)
            else if (tx.binary_type) {
              const key = `${tx.asset}-${tx.binary_type}`;
              if (openStacks[key] && openStacks[key].length > 0) {
                const matchedId = openStacks[key].shift();
                if (matchedId) tx.smart_id = matchedId;
              }
            }

            // --- MERGING LOGIC ---
            // Use map for fast lookup
            const parentStake = tx.smart_id ? idMap[tx.smart_id] : null;
            if (parentStake && (parentStake.type === 'buy' || parentStake.type === 'sell') && !parentStake.binary_result) {
              // If it's a deposit linked to a trade, it's a refund
              if (tx.type === 'deposit') {
                parentStake.binary_result = 'Refunded';
                parentStake.total = tx.total; // Show the refunded amount
                tx.type = 'refund-marker'; // Mark for filtering
              } else {
                parentStake.binary_result = tx.binary_result;
                const isWin = tx.binary_result?.toLowerCase() === 'win' || tx.binary_result?.toLowerCase() === 'won';
                if (isWin) {
                  parentStake.total = tx.total;
                  parentStake.is_win = true; 
                } else {
                  parentStake.is_loss = true;
                }
              }
            }
          }
        });

        // 4. Sort back to newest first for the UI (with ID tie-breaker)
        setTransactions(
          processed
            .filter((t: Transaction) => t.type !== 'win' && t.type !== 'loss' && t.type !== 'refund-marker')
            .sort((a: Transaction, b: Transaction) => {
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              if (timeA !== timeB) return timeB - timeA;
              // Secondary sort by ID in descending order for transactions in the same millisecond or second
              return b.id.localeCompare(a.id);
            })
        );
      }

      // Load portfolio
      const { data: portData, error: portError } = await supabase
        .from("portfolio")
        .select("asset_symbol, units")
        .eq("user_id", user.id);

      if (portError) {
        console.error(
          "[WalletContext] Error loading portfolio:",
          portError.message,
          portError.details,
          portError.hint,
        );
      } else {
        // console.log('[WalletContext] Portfolio loaded:', portData?.length ?? 0, 'assets');
        const portMap: Record<string, number> = {};
        (portData ?? []).forEach((p: any) => {
          portMap[p.asset_symbol] = Number(p.units);
        });
        setPortfolio(portMap);
      }
    } catch (err) {
      console.error(
        "[WalletContext] Unexpected error loading wallet data:",
        err,
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMoreTransactions = useCallback(async () => {
    if (!user || loadingMore || !hasMoreTransactions) return;

    setLoadingMore(true);
    try {
      // Find the oldest transaction we have
      const oldestTx = transactions[transactions.length - 1];
      if (!oldestTx) {
        setHasMoreTransactions(false);
        return;
      }

      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .lt("created_at", oldestTx.timestamp)
        .order("created_at", { ascending: false });

      if (txError) throw txError;
      if (!txData || txData.length === 0) {
        setHasMoreTransactions(false);
        return;
      }

      setHasMoreTransactions(txData.length === 100);

      // We need to re-process EVERYTHING to ensure smart linking works across batches
      // But for performance, we can just process the new batch and merge.
      // However, results for previous stakes might be in this new batch!
      
      // Let's get ALL transactions current + new and re-run the linking
      // This is the safest way to keep smart IDs consistent.
      
      // Extract original raw records if possible, or just build from what we have.
      // Actually, since we already 'merged' results into parents, it's tricky.
      // FOR NOW: Let's just append and process.
      
      const newRaw = txData.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        asset: tx.asset_symbol,
        amount: Number(tx.amount),
        price: Number(tx.price),
        total: Number(tx.total),
        timestamp: tx.created_at,
        status: tx.status,
        binary_type: tx.binary_type,
        binary_result: tx.binary_result,
        trade_id: tx.binary_trade_id || tx.id,
        smart_id: (tx.binary_trade_id || tx.id).slice(-4).toUpperCase(),
      }));

      // Re-run linking on the combined set
      // We need to fetch the raw data of EXISTING transactions too because state is already merged.
      // To keep it simple and fast, we just treat the new batch as independent for now
      // knowing that results/stakes crossing a 100-batch boundary is rare.
      
      const processedNew = newRaw.map((tx: any) => ({...tx}) as Transaction);
      
      // Basic linking for the new batch
      const openStacks: Record<string, string[]> = {};
      processedNew.sort((a: Transaction, b: Transaction) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      processedNew.forEach((tx: Transaction) => {
        if (!tx.binary_type) return;
        const key = `${tx.asset}-${tx.binary_type}`;
        if (!tx.binary_result) {
          if (!openStacks[key]) openStacks[key] = [];
          openStacks[key].push(tx.smart_id!);
        } else {
          if (openStacks[key] && openStacks[key].length > 0) {
            tx.smart_id = openStacks[key].shift();
          }
          const parent = processedNew.find((t: Transaction) => t.smart_id === tx.smart_id && !t.binary_result);
          if (parent) {
            parent.binary_result = tx.binary_result;
            if (tx.binary_result?.toLowerCase().includes('win')) {
              parent.total = tx.total;
              parent.is_win = true;
            } else {
              parent.is_loss = true;
            }
          }
        }
      });

      const finalNew = processedNew
        .filter((t: Transaction) => t.type !== 'win' && t.type !== 'loss')
        .sort((a: Transaction, b: Transaction) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setTransactions(prev => [...prev, ...finalNew]);
      
    } catch (err) {
      console.error("[WalletContext] Error loading more transactions:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [user, transactions, hasMoreTransactions, loadingMore]);

  /**
   * RECONCILIATION: Check for trades that settled while offline/refreshing
   */
  const reconcileSettledTrades = useCallback(async () => {
    if (!user || !profile || hasReconciled.current) return;
    
    // console.log("[WalletContext] Reconciling settled trades...");
    
    try {
      // 1. Get last 10 settled trades
      const { data, error } = await supabase
        .from('binary_trades')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['won', 'lost'])
        .order('settled_at', { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) {
        hasReconciled.current = true;
        return;
      }

      // 2. Get the list of IDs already notified from localStorage
      const notifiedIdsRaw = localStorage.getItem(`notified_trades_${user.id}`);
      const notifiedIds = notifiedIdsRaw ? JSON.parse(notifiedIdsRaw) : [];
      
      let newNotifications = 0;
      const now = new Date();

      // 3. Compare and notify for any "recent" settled trades
      for (const trade of data) {
        // --- HARDENING: Time-bound check ---
        // Only notify if trade was settled in the last 60 seconds.
        // This prevents old history from triggering popups on page refresh.
        const settledAt = new Date(trade.settled_at);
        const diffSeconds = (now.getTime() - settledAt.getTime()) / 1000;
        
        if (diffSeconds > 60) continue; 

        if (!notifiedIds.includes(trade.id)) {
          const won = trade.status === 'won';
          const payout = won 
            ? Number(trade.amount) + (Number(trade.amount) * Number(trade.payout_percent)) / 100 
            : 0;

          // console.log(`[WalletContext] Retro-notifying trade ${trade.id} (${trade.status})`);

          // Trigger winner modal event
          window.dispatchEvent(
            new CustomEvent("binary-trade-result", {
              detail: {
                won,
                assetSymbol: trade.asset_symbol,
                amount: Number(trade.amount),
                payout: won ? payout : 0, // Fix: Payout is 0 for loss
              },
            })
          );

          // Note: WIN emails are now handled exclusively by Supabase Edge Functions in the background.
          
          notifiedIds.push(trade.id);
          newNotifications++;
        }
      }

      if (newNotifications > 0) {
        // Keep only top 20 to avoid localStorage bloat
        const updatedNotified = notifiedIds.slice(-20);
        localStorage.setItem(`notified_trades_${user.id}`, JSON.stringify(updatedNotified));
      }

      hasReconciled.current = true;
    } catch (err) {
      console.error("[WalletContext] Reconciliation failed:", err);
    }
  }, [user, profile, language]);

  const refreshWallet = useCallback(async () => {
    await refreshProfile();
    await loadData(true);
  }, [refreshProfile, loadData]);

  // --- Realtime Subscription for Trade Results ---
  useEffect(() => {
    if (!user) return;

    // Load initial active trades from DB
    const loadActiveTrades = async () => {
      const { data, error } = await supabase
        .from('binary_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (!error && data) {
        setActiveBinaryTrades(data.map((t: any) => ({
          id: t.id,
          type: t.type,
          assetSymbol: t.asset_symbol,
          amount: Number(t.amount),
          entryPrice: Number(t.entry_price),
          payoutPercent: Number(t.payout_percent),
          startTime: new Date(t.created_at).getTime(),
          expiryTime: Number(t.expiry_time),
          status: t.status
        })));
      }
    };
    loadActiveTrades();

    // Subscribe to changes in binary_trades table
    const channel = supabase
      .channel(`binary-trades-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'binary_trades',
          filter: `user_id=eq.${user.id}`
        },
        async (payload: any) => {
          const updatedTrade = payload.new as any;
          
          // If a trade was settled (won/lost)
          if (updatedTrade.status === 'won' || updatedTrade.status === 'lost') {
            const won = updatedTrade.status === 'won';
            const payout = won 
              ? Number(updatedTrade.amount) + (Number(updatedTrade.amount) * Number(updatedTrade.payout_percent)) / 100 
              : 0;

            // Trigger winner modal event
            window.dispatchEvent(
              new CustomEvent("binary-trade-result", {
                detail: {
                  won,
                  assetSymbol: updatedTrade.asset_symbol,
                  amount: Number(updatedTrade.amount),
                  payout: won ? payout : 0, 
                },
              })
            );

            // Note: Backend Edge Function sends email notifications.

            // Update local balance and trades
            refreshProfile(); // Backend already updated the DB, so we just refresh
            setActiveBinaryTrades(prev => prev.filter(t => t.id !== updatedTrade.id));
            
            // Refresh transactions list
            loadData(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshProfile, loadData]);

  // --- Load data from Supabase on mount ---
  useEffect(() => {
    const init = async () => {
      await loadData();
      // Small delay to ensure state is settled before reconciliation
      setTimeout(() => {
        reconcileSettledTrades();
      }, 2000);
    };
    init();
  }, [loadData, reconcileSettledTrades]);

  // --- Frontend Fallback to Trigger Edge Function & Poll ---
  // If `pg_cron` fails, the frontend manually pings the Edge Function.
  // We also poll the DB directly to see if trades resolved, in case Realtime is disabled.
  useEffect(() => {
    if (activeBinaryTrades.length === 0 || !user) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const expiredTrades = activeBinaryTrades.filter(
        (t: any) => now >= t.expiryTime && (t.status === "pending" || t.status === "active"),
      );

      if (expiredTrades.length === 0) return;

      const newExpired = expiredTrades.filter((t: any) => !processingTradeIds.current.has(t.id));
      if (newExpired.length > 0) {
        newExpired.forEach((t: any) => processingTradeIds.current.add(t.id));
        try {
          // Ping the edge function to wake it up
          const { error } = await supabase.functions.invoke('resolve-trades');
          if (error) console.error(`[WalletContext] Func Invoke Error:`, error);
        } catch (err) {
          console.error(`[WalletContext] Error invoking Edge Function:`, err);
        }
      }

      // Poll the DB to check if ANY of our expired trades got resolved by the backend
      const expiredTradeIds = expiredTrades.map(t => t.id);
      const { data: dbTrades } = await supabase
        .from('binary_trades')
        .select('id, status, amount, payout_percent, asset_symbol')
        .in('id', expiredTradeIds);
        
      if (dbTrades) {
         let resolvedCount = 0;
         dbTrades.forEach((dbTrade: any) => {
            if (dbTrade.status === 'won' || dbTrade.status === 'lost') {
                const won = dbTrade.status === 'won';
                const payout = won 
                  ? Number(dbTrade.amount) + (Number(dbTrade.amount) * Number(dbTrade.payout_percent)) / 100 
                  : 0;

                // Fire modal event
                window.dispatchEvent(
                  new CustomEvent("binary-trade-result", {
                    detail: {
                      won,
                      assetSymbol: dbTrade.asset_symbol,
                      amount: Number(dbTrade.amount),
                      payout: won ? payout : 0, 
                    },
                  })
                );

                // Update UI state immediately
                setActiveBinaryTrades(prev => prev.filter(t => t.id !== dbTrade.id));
                resolvedCount++;
                processingTradeIds.current.delete(dbTrade.id);
            }
         });
         
         if (resolvedCount > 0) {
             refreshProfile();
             loadData();
         }
      }

    }, 2000);

    return () => clearInterval(interval);
  }, [activeBinaryTrades, user, refreshProfile, loadData]);

  // --- Trade Handler ---
  const handleTrade = async (
    type: "buy" | "sell",
    asset: any,
    amountUSD: number,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: "Not authenticated" };

    // Use the latest balance from state (synced with profile)
    if (type === "buy" && amountUSD > balance)
      return { success: false, message: "Insufficient balance" };

    const units = amountUSD / asset.price;

    // console.log(`[WalletContext] Executing ${type} trade:`, asset.symbol, 'amount:', amountUSD);
    try {
      if (type === "buy") {
        const newBalance = balance - amountUSD;
        const newUnits = (portfolio[asset.symbol] || 0) + units;

        // 1. Update balance
        const { error: balErr } = await supabase
          .from("profiles")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", user.id);
        if (balErr) {
          console.error("[WalletContext] Balance update failed:", balErr);
          return {
            success: false,
            message: "Failed to update balance: " + balErr.message,
          };
        }

        // 2. Insert transaction
        const { data: txData, error: txErr } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type: "buy",
            asset_symbol: asset.symbol,
            amount: units,
            price: asset.price,
            total: amountUSD,
            status: "success",
          })
          .select()
          .single();
        if (txErr) {
          console.error("[WalletContext] Transaction insert failed:", txErr);
          return {
            success: false,
            message: "Failed to save transaction: " + txErr.message,
          };
        }

        // 3. Upsert portfolio
        const { error: portErr } = await supabase
          .from("portfolio")
          .upsert(
            {
              user_id: user.id,
              asset_symbol: asset.symbol,
              units: newUnits,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,asset_symbol" },
          );
        if (portErr) {
          console.error("[WalletContext] Portfolio upsert failed:", portErr);
        }

        // 4. Update local state
        setBalance(newBalance);
        setPortfolio((prev) => ({ ...prev, [asset.symbol]: newUnits }));
        if (txData) {
          setTransactions((prev) => [
            {
              id: txData.id,
              type: "buy",
              asset: asset.symbol,
              amount: units,
              price: asset.price,
              total: amountUSD,
              timestamp: txData.created_at,
              status: "success",
            },
            ...prev,
          ]);
        }
        await refreshProfile();
        // console.log('[WalletContext] Buy success:', units.toFixed(6), asset.symbol);
        return {
          success: true,
          message: `Bought ${units.toFixed(4)} ${asset.symbol}`,
        };
      } else {
        const held = portfolio[asset.symbol] || 0;
        if (units > held)
          return { success: false, message: "Insufficient assets" };

        const newBalance = balance + amountUSD;
        const newUnits = held - units;

        // 1. Update balance
        const { error: balErr } = await supabase
          .from("profiles")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", user.id);
        if (balErr) {
          console.error("[WalletContext] Balance update failed:", balErr);
          return {
            success: false,
            message: "Failed to update balance: " + balErr.message,
          };
        }

        // 2. Insert transaction
        const { data: txData, error: txErr } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type: "sell",
            asset_symbol: asset.symbol,
            amount: units,
            price: asset.price,
            total: amountUSD,
            status: "success",
          })
          .select()
          .single();
        if (txErr) {
          console.error("[WalletContext] Transaction insert failed:", txErr);
          return {
            success: false,
            message: "Failed to save transaction: " + txErr.message,
          };
        }

        // 3. Upsert portfolio
        const { error: portErr } = await supabase
          .from("portfolio")
          .upsert(
            {
              user_id: user.id,
              asset_symbol: asset.symbol,
              units: newUnits,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,asset_symbol" },
          );
        if (portErr) {
          console.error("[WalletContext] Portfolio upsert failed:", portErr);
        }

        // 4. Update local state
        setBalance(newBalance);
        setPortfolio((prev) => ({ ...prev, [asset.symbol]: newUnits }));
        if (txData) {
          setTransactions((prev) => [
            {
              id: txData.id,
              type: "sell",
              asset: asset.symbol,
              amount: units,
              price: asset.price,
              total: amountUSD,
              timestamp: txData.created_at,
              status: "success",
            },
            ...prev,
          ]);
        }
        await refreshProfile();
        // console.log('[WalletContext] Sell success:', units.toFixed(6), asset.symbol);
        return {
          success: true,
          message: `Sold ${units.toFixed(4)} ${asset.symbol}`,
        };
      }
    } catch (err) {
      console.error("[WalletContext] Trade execution unexpected error:", err);
      return { success: false, message: "Transaction failed unexpectedly" };
    }
  };


  const createBinaryTrade = async (
    type: "up" | "down",
    asset: any,
    amountUSD: number,
    durationMinutes: number,
    payoutPercent: number,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: "Not authenticated" };
    if (amountUSD > balance)
      return { success: false, message: "Insufficient balance" };

    try {
      const expiryTime = Date.now() + durationMinutes * 60 * 1000;
      
      // --- ATOMIC TRADE PLACEMENT VIA RPC ---
      // This handles: Balance check -> Deduction -> Entry Insertion -> Transaction Logging
      // All happen in one database transaction to ensure data integrity.
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('place_binary_trade', {
        p_user_id: user.id,
        p_type: type,
        p_asset_symbol: asset.symbol,
        p_amount: amountUSD,
        p_entry_price: asset.price,
        p_payout_percent: payoutPercent,
        p_expiry_time: expiryTime
      });

      if (rpcErr || !rpcRes?.success) {
        console.error("[WalletContext] Atomic trade placement failed:", rpcErr || rpcRes?.message);
        return { 
          success: false, 
          message: rpcRes?.message || "Server Error: Could not place trade" 
        };
      }

      // Success: Refresh all local data from the source of truth
      await refreshProfile();
      await loadData(true);
      
      // Re-fetch active trades to ensure local state is in sync
      const { data: activeData } = await supabase
        .from('binary_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (activeData) {
        setActiveBinaryTrades(activeData.map((t: any) => ({
          id: t.id,
          type: t.type,
          assetSymbol: t.asset_symbol,
          amount: Number(t.amount),
          entryPrice: Number(t.entry_price),
          payoutPercent: Number(t.payout_percent),
          startTime: new Date(t.created_at).getTime(),
          expiryTime: Number(t.expiry_time),
          status: t.status
        })));
      }

      return {
        success: true,
        message: `Binary Option Created: ${type.toUpperCase()} ${asset.symbol} for ${durationMinutes}m`,
      };

    } catch (err) {
      console.error("[WalletContext] createBinaryTrade error:", err);
      return { success: false, message: "Failed unexpectedly" };
    }
  };
  const deposit = async (amount: number) => {
    if (!user) return;
    const newBalance = balance + amount;
    const { error: balErr } = await supabase
      .from("profiles")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (balErr) {
      console.error("[WalletContext] Deposit balance update failed:", balErr);
      return;
    }
    const { data: txData, error: txErr } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "deposit",
        asset_symbol: "USD",
        amount: amount,
        price: 1,
        total: amount,
        status: "success",
      })
      .select()
      .single();
    if (txErr) {
      console.error(
        "[WalletContext] Deposit transaction insert failed:",
        txErr,
      );
    }
    setBalance(newBalance);
    setTransactions((prev) => [
      {
        id: txData?.id ?? Math.random().toString(36).slice(2),
        type: "deposit",
        asset: "USD",
        amount,
        price: 1,
        total: amount,
        timestamp: txData?.created_at ?? new Date().toISOString(),
        status: "success",
      },
      ...prev,
    ]);
    await refreshProfile();
  };

  // --- Withdraw ---
  const withdraw = async (amount: number): Promise<boolean> => {
    if (!user || amount > balance) return false;
    const newBalance = balance - amount;
    const { error: balErr } = await supabase
      .from("profiles")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (balErr) {
      console.error("[WalletContext] Withdraw balance update failed:", balErr);
      return false;
    }
    const { data: txData, error: txErr } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "withdraw",
        asset_symbol: "USD",
        amount: amount,
        price: 1,
        total: amount,
        status: "success",
      })
      .select()
      .single();
    if (txErr) {
      console.error(
        "[WalletContext] Withdraw transaction insert failed:",
        txErr,
      );
    }
    setBalance(newBalance);
    setTransactions((prev) => [
      {
        id: txData?.id ?? Math.random().toString(36).slice(2),
        type: "withdraw",
        asset: "USD",
        amount,
        price: 1,
        total: amount,
        timestamp: txData?.created_at ?? new Date().toISOString(),
        status: "success",
      },
      ...prev,
    ]);
    await refreshProfile();
    return true;
  };

  const contextValue = React.useMemo(() => ({
    balance,
    transactions,
    portfolio,
    loading,
    activeBinaryTrades,
    totalDeposited,
    tierThresholds,
    handleTrade,
    createBinaryTrade,
    deposit,
    withdraw,
    refreshWallet,
    loadMoreTransactions,
    hasMoreTransactions,
    loadingMore
  }), [balance, transactions, portfolio, loading, activeBinaryTrades, totalDeposited, tierThresholds, handleTrade, createBinaryTrade, deposit, withdraw, refreshWallet, loadMoreTransactions, hasMoreTransactions, loadingMore]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined)
    throw new Error("useWallet must be used within a WalletProvider");
  return context;
};
