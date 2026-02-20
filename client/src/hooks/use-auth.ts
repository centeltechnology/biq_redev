import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Baker } from "@shared/schema";

interface AuthSession {
  baker: Baker;
}

export function useAuth() {
  const [, setLocation] = useLocation();

  const { data: session, isLoading, error } = useQuery<AuthSession | null>({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      setLocation("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; businessName: string; inviteToken?: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      setLocation("/onboarding");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      setLocation("/login");
    },
  });

  return {
    baker: session?.baker ?? null,
    isLoading,
    isAuthenticated: !!session?.baker,
    error,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
