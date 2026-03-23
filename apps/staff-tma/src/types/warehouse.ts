export interface Warehouse {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
}

export interface CreateWarehouseDTO {
  name: string;
  location: string;
}

export interface UpdateWarehouseDTO {
  name: string;
  location: string;
  is_active?: boolean;
}
