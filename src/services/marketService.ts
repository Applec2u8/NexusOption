import type React from "react";

import { assets } from "../data/marketData";
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

// Validation log (internal)
if (!FINNHUB_API_KEY) {
  console.warn("[MarketService] VITE_FINNHUB_API_KEY is missing. Stock prices will use mock data.");
}

export interface StockData {
  id: number;
  name: string;
  symbol: string;
  price: number;
  change: number;
  icon?: React.ReactNode;
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
}

/**
 * Fetch detailed crypto data from Binance (24hr ticker)
 */
async function fetchCryptoDetails(symbol: string): Promise<Partial<StockData> | null> {
  try {
    const binanceSymbol = `${symbol}USDT`;
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
    const data = await response.json();
    if (data.lastPrice) {
      return {
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.priceChangePercent),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        open: parseFloat(data.openPrice),
        volume: parseFloat(data.quoteVolume)
      };
    }
    return null;
  } catch (error) {
    if ((error as Error).name === 'TimeoutError' || (error as Error).name === 'AbortError') {
      console.warn(`[MarketService] Timeout fetching crypto details for ${symbol}`);
    } else {
      console.error(`[MarketService] Error fetching crypto details for ${symbol}:`, error);
    }
    return null;
  }
}

/**
 * Fetch stock price and details from Finnhub
 */
async function fetchStockPrice(symbol: string): Promise<Partial<StockData> | null> {
  if (!FINNHUB_API_KEY) return null;
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`, { signal: AbortSignal.timeout(5000) });
    
    if (response.status === 401) {
      console.warn(`[MarketService] Finnhub 401: Unauthorized. Check VITE_FINNHUB_API_KEY.`);
      return null;
    }
    
    if (response.status === 429) {
      console.warn(`[MarketService] Finnhub 429: Rate limit exceeded.`);
      return null;
    }

    if (!response.ok) throw new Error(`Finnhub API error: ${response.status}`);

    const data = await response.json();
    if (data.c && data.c > 0) {
      return {
        price: data.c,
        change: data.dp || 0,
        high: data.h,
        low: data.l,
        open: data.o
      };
    }
    return null;
  } catch (error) {
    if ((error as Error).name === 'TimeoutError' || (error as Error).name === 'AbortError') {
      console.warn(`[MarketService] Timeout fetching stock price for ${symbol}`);
    } else {
      console.error(`[MarketService] Error fetching stock price for ${symbol}:`, error);
    }
    return null;
  }
}

/**
 * Fetch gold price (XAU/USD) from a CORS-friendly API
 */
async function fetchGoldPrice(): Promise<number | null> {
  try {
    const response = await fetch(`https://api.gold-api.com/price/XAU`);
    const data = await response.json();
    return data.price || null;
  } catch (error) {
    console.error("Error fetching gold price:", error);
    return null;
  }
}

// Simple cache to prevent redundant fetches within a short window
const priceCache: Record<string, { price: Partial<StockData>; timestamp: number }> = {};
const CACHE_DURATION = 2000; // 2 seconds

export const marketService = {
  async fetchSymbolPrice(symbol: string): Promise<Partial<StockData> | null> {
    const now = Date.now();
    if (priceCache[symbol] && (now - priceCache[symbol].timestamp) < CACHE_DURATION) {
      return priceCache[symbol].price;
    }

    const cryptoSymbols = ["BTC", "ETH", "USDT", "BNB", "SOL", "DOGE"];
    let result: Partial<StockData> | null = null;

    // Handle Crypto
    if (cryptoSymbols.includes(symbol)) {
      if (symbol === "USDT") {
        result = { price: 1.0, change: 0, high: 1.0, low: 1.0 };
      } else {
        result = await fetchCryptoDetails(symbol);
      }
    } 
    // Handle Gold
    else if (symbol === "GOLD") {
      const price = await fetchGoldPrice();
      if (price) result = { price, change: 0, high: price, low: price };
    } 
    // Handle Stocks
    else {
      result = await fetchStockPrice(symbol);
    }

    // ULTIMATE FALLBACK: Use hardcoded data if all APIs fail
    if (!result) {
      const fallbackAsset = assets.find(a => a.symbol === symbol);
      if (fallbackAsset) {
        const fluctuation = 1 + (Math.random() * 0.004 - 0.002);
        const mockPrice = fallbackAsset.price * fluctuation;
        result = {
          price: Number(mockPrice.toFixed(2)),
          change: fallbackAsset.change + (Math.random() * 0.2 - 0.1),
        };
      }
    }

    if (result) {
      priceCache[symbol] = { price: result, timestamp: Date.now() };
    }
    return result;
  },

  async updateStocks(currentStocks: StockData[]): Promise<StockData[]> {
    const cryptoSymbols = ["BTC", "ETH", "USDT", "BNB", "SOL", "DOGE"];
    const goldPrice = await fetchGoldPrice();

    const updatedStocks = await Promise.all(
      currentStocks.map(async (stock) => {
        // Handle Crypto
        if (cryptoSymbols.includes(stock.symbol)) {
          if (stock.symbol === "USDT") return { ...stock, price: 1.0, change: 0 };
          const details = await fetchCryptoDetails(stock.symbol);
          if (details) return { ...stock, ...details } as StockData;
        }

        // Handle Gold
        if (stock.symbol === "GOLD" && goldPrice) {
          return { ...stock, price: goldPrice };
        }

        // Handle Stocks (using Finnhub)
        if (!cryptoSymbols.includes(stock.symbol) && stock.symbol !== "GOLD") {
          const details = await fetchStockPrice(stock.symbol);
          if (details) return { ...stock, ...details } as StockData;
        }

        return stock; // Fallback to current
      })
    );

    return updatedStocks;
  }
};
