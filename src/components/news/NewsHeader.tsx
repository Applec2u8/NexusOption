import React from "react";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

interface NewsHeaderProps {
  title: string;
  subtitle: string;
  badgeText: string;
}

export const NewsHeader: React.FC<NewsHeaderProps> = ({
  title,
  subtitle,
  badgeText,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center space-y-2 mb-12"
  >
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/20 text-xs font-bold tracking-widest uppercase">
      <Newspaper size={14} />
      {badgeText}
    </div>
    <h1 className="text-5xl font-black text-text-main tracking-tight">{title}</h1>
    <p className="text-text-muted font-medium">{subtitle}</p>
  </motion.div>
);
