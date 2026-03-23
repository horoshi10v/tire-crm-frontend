export interface AuditLogResponse {
  id: string;
  entity: string;
  entity_id: string;
  action: string;
  user_id: string;
  user_label: string;
  comment?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogFilters {
  page?: number;
  page_size?: number;
  entity?: string;
  action?: string;
  user?: string;
  start_date?: string;
  end_date?: string;
}

export interface AuditLogListResponse {
  items: AuditLogResponse[];
  total: number;
}
