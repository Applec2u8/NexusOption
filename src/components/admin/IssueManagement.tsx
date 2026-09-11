import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Search, 
  ChevronRight, 
  Loader2, 
  ShieldCheck, 
  Send,
  User,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../contexts/LanguageContext";

interface IssueReport {
  id: string;
  user_id: string;
  smart_id: number;
  category: string;
  subject: string;
  message: string;
  admin_response: string | null;
  status: 'pending' | 'resolved';
  created_at: string;
  updated_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
}

export const IssueManagement: React.FC = () => {
  const { language } = useLanguage();
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<IssueReport | null>(null);
  const [response, setResponse] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReport(null);
        setResponse("");
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("issue_reports")
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email,
            username
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data as any[] || []);
    } catch (err) {
      console.error("[IssueManagement] fetchReports Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, status: 'resolved', adminResponse: string) => {
    if (!adminResponse.trim()) {
      alert(language === 'th' ? "กรุณากรอกคำตอบรับจากแอดมิน" : "Please enter an admin response");
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("issue_reports")
        .update({ 
          status, 
          admin_response: adminResponse.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", reportId);

      if (error) throw error;
      
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status, admin_response: adminResponse.trim() } : r));
      setSelectedReport(null);
      setResponse("");
      alert(language === 'th' ? "อัปเดตสถานะเรียบร้อยแล้ว" : "Status updated successfully");
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.smart_id.toString().includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex p-1 bg-card border border-border rounded-xl shadow-lg">
          {(['all', 'pending', 'resolved'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === status 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-text-muted hover:text-text-main hover:bg-card-header/50"
              }`}
            >
              {status === 'all' ? (language === 'th' ? 'ทั้งหมด' : 'All') : 
               status === 'pending' ? (language === 'th' ? 'รอดำเนินการ' : 'Pending') : 
               (language === 'th' ? 'แก้ไขแล้ว' : 'Resolved')}
              {status === 'pending' && pendingCount > 0 && (
                <span className="ml-2 w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
          <input
            type="text"
            placeholder={language === 'th' ? "ค้นหาตั๋ว/หัวข้อ..." : "Search tickets..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-9 pr-4 text-text-main text-xs focus:ring-2 focus:ring-primary/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : filteredReports.length === 0 ? (
          <div className="glass-card py-20 text-center text-text-muted text-[10px] font-black uppercase tracking-widest border-dashed">
            {language === 'th' ? "ไม่พบรายการ" : "No reports found"}
          </div>
        ) : (
          filteredReports.map(report => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="glass-card p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-card-header/30 border-border transition-all group shadow-md"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${
                  report.status === 'resolved' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                }`}>
                  <span className="text-xs">#{report.smart_id}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-primary/20">
                      {report.category}
                    </span>
                    <h4 className="text-xs font-bold text-text-main truncate">{report.subject}</h4>
                  </div>
                  <p className="text-[9px] text-text-muted font-bold">{report.profiles.username} • {new Date(report.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-text-muted group-hover:text-primary transition-colors" />
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm cursor-pointer"
            onClick={() => { setSelectedReport(null); setResponse(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-card-header/50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${
                    selectedReport.status === 'resolved' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                  }`}>
                    <span className="text-sm">#{selectedReport.smart_id}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-main leading-tight">{selectedReport.subject}</h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{selectedReport.category} • {new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedReport(null); setResponse(""); }} className="p-2 hover:bg-card-header rounded-lg text-text-muted transition-colors"><X size={20} /></button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-card-header/30 border border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner"><User size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-text-main uppercase tracking-widest truncate">{selectedReport.profiles.username}</p>
                    <p className="text-[9px] text-text-muted truncate">{selectedReport.profiles.email}</p>
                  </div>
                  <span className="text-[8px] font-black text-primary/50 uppercase border border-primary/20 px-2 py-0.5 rounded-lg">VERIFIED</span>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest px-1">{language === 'th' ? "ข้อความจากผู้ใช้" : "User Message"}</p>
                  <div className="p-4 rounded-2xl bg-transparent border border-border text-xs text-text-main leading-relaxed whitespace-pre-wrap">
                    {selectedReport.message}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 px-1">
                    <ShieldCheck size={12} className="text-primary" />
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">{language === 'th' ? "การตอบกลับจากแอดมิน" : "Admin Response"}</p>
                  </div>
                  
                  {selectedReport.status === 'resolved' ? (
                    <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 text-xs text-green-600/80 italic shadow-inner">
                      "{selectedReport.admin_response}"
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="..."
                        className="w-full bg-transparent border border-border rounded-2xl p-4 text-xs text-text-main focus:border-primary/50 outline-none min-h-[120px] resize-none"
                      />
                      <button
                        onClick={() => handleUpdateStatus(selectedReport.id, 'resolved', response)}
                        disabled={isSaving || !response.trim()}
                        className="w-full py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                        {language === 'th' ? "ส่งข้อความและปิดงาน" : "Send & Resolve"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
