import React, { useEffect, useRef, memo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol, interval = "1" }) => {
  const container = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    setIsLoaded(false);

    // Clean up previous widget
    const widgetContainer = container.current.querySelector('.tradingview-widget-container__widget');
    if (widgetContainer) {
      widgetContainer.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Map internal symbols to TradingView symbols
    const tvSymbol = symbol === 'GOLD' ? 'OANDA:XAUUSD' : 
                     symbol === 'BTC' ? 'BINANCE:BTCUSDT' :
                     symbol === 'ETH' ? 'BINANCE:ETHUSDT' :
                     symbol === 'CART' ? 'NASDAQ:CART' :
                     symbol === 'NVDA' ? 'NASDAQ:NVDA' :
                     symbol === 'AAPL' ? 'NASDAQ:AAPL' :
                     `NASDAQ:${symbol}`;

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": theme === "light" ? "light" : "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "allow_symbol_change": false,
      "calendar": false,
      "hide_volume": false,
      "support_host": "https://www.tradingview.com"
    });

    script.onload = () => {
      // Small delay to let the widget start rendering before removing skeleton
      setTimeout(() => setIsLoaded(true), 1500);
    };

    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }
  }, [symbol, interval, theme]);

  return (
    <div className="tradingview-widget-container h-full w-full rounded-2xl overflow-hidden border border-border shadow-2xl relative" ref={container}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-card overflow-hidden flex items-center justify-center">
          {/* Subtle Grid Background */}
          <div 
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
            style={{
              backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: 'center center'
            }}
          />

          {/* Elegant Centered Loader */}
          <div className="relative z-20 flex flex-col items-center justify-center gap-5">
            <div className="relative flex items-center justify-center">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse scale-150" />
              {/* Spinner */}
              <div className="w-12 h-12 md:w-14 md:h-14 border-[3px] border-primary/10 border-t-primary border-r-primary/50 rounded-full animate-spin shadow-lg" />
            </div>
            
            {/* Status Pill */}
            <div className="bg-card/80 backdrop-blur-md border border-border/50 px-5 py-2.5 rounded-full shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] md:text-[11px] font-black text-text-main uppercase tracking-[0.2em] opacity-80">
                  Loading Chart
                </p>
              </div>
            </div>
          </div>
          
          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-card to-transparent pointer-events-none z-10" />
        </div>
      )}
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
};

export default memo(TradingViewChart);
