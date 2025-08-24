import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'physiotherapist';
  profileImageUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'physiotherapist';
  phoneNumber?: string;
  licenseNumber?: string;
}

export class AuthService {
  private static TOKEN_KEY = 'auth_token';
  private static USER_KEY = 'auth_user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getUser(): AuthUser | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static async login(credentials: LoginCredentials): Promise<{ token: string; user: AuthUser }> {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    const data = await response.json();
    
    this.setToken(data.token);
    this.setUser(data.user);
    
    return data;
  }

  static async register(userData: RegisterData): Promise<void> {
    await apiRequest('POST', '/api/auth/register', userData);
  }

  static logout(): void {
    this.removeToken();
    window.location.href = '/login';
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }

  static isPhysiotherapist(): boolean {
    const user = this.getUser();
    return user?.role === 'physiotherapist';
  }
}
