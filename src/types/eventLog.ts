export interface EventLog {
  id: string;
  timestamp: string;
  client_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: EventAction;
  product_id?: string;
  product_name?: string;
  details?: Record<string, any>;
}

export type EventAction =
  | 'product_added'
  | 'product_deleted'
  | 'product_duplicated'
  | 'product_edited'
  | 'step_executed'
  | 'step_rerun'
  | 'categories_configured';

export interface EventLogFilters {
  action?: EventAction;
  product_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface EventLogsResponse {
  logs: EventLog[];
  total: number;
  limit: number;
  skip: number;
}

