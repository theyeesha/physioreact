import { useState, useEffect } from 'react';
import { AuthService, type AuthUser } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = AuthService.getUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const { user } = await AuthService.login(credentials);
    setUser(user);
    return user;
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isPhysiotherapist = user?.role === 'physiotherapist';

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isPhysiotherapist,
    login,
    logout
  };
}
