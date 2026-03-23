export type UserRole = 'ADMIN' | 'STAFF' | 'BUYER';

export interface AdminUser {
  id: string;
  first_name?: string;
  username?: string;
  phone_number?: string;
  telegram_id?: number;
  role: UserRole;
}

export interface CreateWorkerDTO {
  first_name?: string;
  phone_number?: string;
  username?: string;
  telegram_id?: number;
  role: Exclude<UserRole, 'BUYER'>;
}

export interface UpdateUserRoleDTO {
  role: UserRole;
}

export interface AdminUsersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  role?: UserRole;
}
