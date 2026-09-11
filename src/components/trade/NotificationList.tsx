import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface NotificationListProps {
  notifications: Notification[];
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
}) => (
  <div className="fixed top-20 right-3 z-50 flex flex-col gap-1 pointer-events-none max-w-[calc(100vw-24px)] w-auto">
    <AnimatePresence>
      {notifications.map((notif) => (
        <motion.div
          key={notif.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 8 }}
          className={`px-2 py-1.5 rounded-lg border flex items-start gap-1.5 text-[9px] font-bold shadow-xl backdrop-blur-md pointer-events-auto leading-tight ${
            notif.type === "success" 
              ? "bg-green-500/20 border-green-500/30 text-green-400" 
              : notif.type === "warning"
                ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                : notif.type === "info"
                  ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400"
                  : "bg-red-500/20 border-red-500/30 text-red-400"
          }`}
        >
          {notif.type === "success" ? (
            <CheckCircle2 size={10} className="shrink-0 mt-px" />
          ) : notif.type === "info" ? (
            <CheckCircle2 size={10} className="shrink-0 mt-px text-indigo-400" />
          ) : notif.type === "warning" ? (
            <AlertCircle size={10} className="shrink-0 mt-px text-orange-400" />
          ) : (
            <AlertCircle size={10} className="shrink-0 mt-px" />
          )}
          <span className="whitespace-nowrap">{notif.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

