export type TransferStatus = 'IN_TRANSIT' | 'ACCEPTED' | 'CANCELLED' | string;

export interface TransferItemDTO {
  lot_id: string;
  quantity: number;
}

export interface CreateTransferDTO {
  from_warehouse_id: string;
  to_warehouse_id: string;
  items: TransferItemDTO[];
  comment?: string;
}

export interface TransferItemResponse {
  id: string;
  source_lot_id: string;
  quantity: number;
}

export interface TransferResponse {
  id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  status: TransferStatus;
  comment?: string;
  created_at: string;
  created_by?: string;
  accepted_by?: string;
  items: TransferItemResponse[];
}
