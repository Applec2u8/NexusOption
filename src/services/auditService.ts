import { supabase } from '../lib/supabase';

export type AdminActionType = 
  | 'TOP_UP' 
  | 'EDIT_PROFILE' 
  | 'TOGGLE_ROLE' 
  | 'CREATE_USER' 
  | 'UPDATE_SETTINGS'
  | 'WALLET_DEPOSIT'
  | 'WALLET_WITHDRAW'
  | 'TRADE_CONTROL_UPDATE';

interface LogActionParams {
  adminId: string;
  adminEmail: string;
  targetUserId?: string;
  targetUserEmail?: string;
  actionType: AdminActionType;
  description: string;
  details?: any;
}

export const auditService = {
  async logAction({
    adminId,
    adminEmail,
    targetUserId,
    targetUserEmail,
    actionType,
    description,
    details
  }: LogActionParams) {
    try {
      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: adminId,
          admin_email: adminEmail,
          target_user_id: targetUserId,
          target_user_email: targetUserEmail,
          action_type: actionType,
          description,
          details,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[AuditService] Failed to log action:', error);
        alert(`Audit Log Error: ${error.message}`);
      }
    } catch (err: any) {
      console.error('[AuditService] Error:', err);
      alert(`Audit Log Exception: ${err.message}`);
    }
  },

  async fetchLogs(limit = 100) {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AuditService] Failed to fetch logs:', error);
      return [];
    }
    return data;
  }
};
