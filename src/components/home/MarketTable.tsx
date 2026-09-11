import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronDown, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getAssetCategory } from "../../utils/trade";
import { Skeleton } from "../shared/Skeleton";

interface MarketTableProps {
  stocks: any[];
  t: (key: string) => string;
  loading?: boolean;
}

export const MarketTable: React.FC<MarketTableProps> = ({ stocks, t, loading }) => {
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStocks =
    activeCategory === "all"
      ? stocks
      : stocks.filter((s) => getAssetCategory(s.symbol) === activeCategory);

  const categories = ["all", "crypto", "stock", "commodity"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden p-0 bg-card border-border shadow-2xl"
    >
      <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-black text-text-main uppercase tracking-tight">
          {t("activityLedger")}
        </h3>

        {/* Custom Category Dropdown */}
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-5 py-2.5 bg-transparent border border-border rounded-xl text-xs font-black text-text-main uppercase tracking-widest hover:border-primary/50 transition-all shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-primary" />
              <span className="text-left">{t(activeCategory)}</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-text-muted transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full z-[100] mt-2 w-full sm:w-56 glass-card bg-card border-border shadow-2xl p-2"
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-white"
                        : "text-text-muted hover:bg-card-header hover:text-text-main"
                    }`}
                  >
                    {t(cat)}
                    {activeCategory === cat && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-lg shadow-white" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-card-header/50 text-text-muted text-[10px] font-black uppercase tracking-widest border-b border-border">
            <tr>
              <th className="px-6 py-4">{t("allAssets")}</th>
              <th className="px-6 py-4 text-right">{t("latestPrice")}</th>
              <th className="px-6 py-4 text-right">{t("change24h")}</th>
              <th className="px-6 py-4 text-right hidden md:table-cell">
                {t('marketCap')}
              </th>
              <th className="px-6 py-4 text-right hidden lg:table-cell">
                {t('volume')}
              </th>
              <th className="px-6 py-4 text-right">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stocks.length === 0 && loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Skeleton variant="circle" width={40} height={40} />
                      <div className="space-y-2">
                        <Skeleton variant="text" width={100} height={14} />
                        <Skeleton variant="text" width={60} height={10} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Skeleton variant="text" width={80} height={16} className="ml-auto" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Skeleton variant="text" width={60} height={16} className="ml-auto" />
                  </td>
                  <td className="px-6 py-5 text-right hidden md:table-cell">
                    <Skeleton variant="text" width={60} height={12} className="ml-auto" />
                  </td>
                  <td className="px-6 py-5 text-right hidden lg:table-cell">
                    <Skeleton variant="text" width={60} height={12} className="ml-auto" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Skeleton variant="rect" width={70} height={32} className="rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : (
              filteredStocks.map((stock) => (
                <MarketTableRow key={stock.id} stock={stock} navigate={navigate} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// Optimized Row Component
const MarketTableRow: React.FC<{ stock: any; navigate: any }> = React.memo(({ stock, navigate }) => {
  // Use stable dummy values instead of Math.random() in render
  const marketCap = React.useMemo(() => (10 + (stock.id % 500)).toFixed(1), [stock.id]);
  const volume = React.useMemo(() => (1 + (stock.id % 50)).toFixed(1), [stock.id]);

  return (
    <tr
      onClick={() => navigate("/trade", { state: { symbol: stock.symbol } })}
      className="hover:bg-card-header/30 transition-colors group cursor-pointer"
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-card border border-border shadow-sm">
            {stock.icon}
          </div>
          <div>
            <p className="text-text-main font-bold group-hover:text-primary transition-colors">
              {stock.name}
            </p>
            <p className="text-text-muted text-xs">{stock.symbol}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-right font-mono font-bold text-text-main whitespace-nowrap">
        ${stock.price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
      <td className={`px-6 py-5 text-right font-bold text-sm ${stock.change >= 0 ? "text-green-500" : "text-red-500"} whitespace-nowrap`}>
        <span className="flex items-center justify-end gap-1">
          {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(stock.change).toFixed(2)}%
        </span>
      </td>
      <td className="px-6 py-5 text-right font-mono text-xs text-text-muted hidden md:table-cell whitespace-nowrap">
        ${marketCap}B
      </td>
      <td className="px-6 py-5 text-right font-mono text-xs text-text-muted hidden lg:table-cell whitespace-nowrap">
        ${volume}M
      </td>
      <td className="px-6 py-5 text-right">
        <button className="px-4 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-black hover:bg-primary hover:text-white transition-all uppercase tracking-tight">
          TRADE
        </button>
      </td>
    </tr>
  );
});
