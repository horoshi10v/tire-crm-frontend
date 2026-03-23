export type UserRole = 'BUYER' | 'STAFF' | 'ADMIN';

export interface User {
    id: number;
    telegramId: number;
    firstName: string;
    lastName?: string;
    username?: string;
    role: UserRole;
}

export interface AuthResponse {
    token: string;
    user: User;
}