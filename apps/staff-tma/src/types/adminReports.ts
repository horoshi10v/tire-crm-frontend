export interface WarehousePnL {
  warehouse_name: string;
  revenue: number;
  cogs: number;
  profit: number;
  items_sold: number;
}

export interface ChannelPnL {
  channel: 'ONLINE' | 'OFFLINE';
  revenue: number;
  cogs: number;
  profit: number;
  items_sold: number;
}

export interface PnLReport {
  total_revenue: number;
  total_cogs: number;
  total_profit: number;
  total_items_sold: number;
  by_warehouse: WarehousePnL[];
  by_channel: ChannelPnL[];
}

export interface PnLReportFilters {
  start_date?: string;
  end_date?: string;
  warehouse_id?: string;
  channel?: 'ONLINE' | 'OFFLINE';
}

export interface InventoryExportFilters {
  search?: string;
  brand?: string;
  model?: string;
  status?: string;
  type?: string;
  condition?: string;
  season?: string;
  warehouse_id?: string;
  width?: number;
  profile?: number;
  diameter?: number;
  is_run_flat?: boolean;
  is_spiked?: boolean;
  anti_puncture?: boolean;
  sell_price?: number;
  current_quantity?: number;
  page_size?: number;
}
