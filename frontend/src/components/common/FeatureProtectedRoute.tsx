import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useConfig } from "@/contexts/ConfigContext";
import { toast } from "react-hot-toast";
import Loading from "./Loading";

interface FeatureProtectedRouteProps {
  children: ReactNode;
  feature: "chapter" | "retro";
}

const FEATURE_NAMES = {
  chapter: "Chapter",
  retro: "Retro",
};

export function FeatureProtectedRoute({
  children,
  feature,
}: FeatureProtectedRouteProps) {
  const { isChapterEnabled, isRetroEnabled, loading } = useConfig();

  // Mostrar loading enquanto carrega configuração
  if (loading) {
    return <Loading fullScreen text="Carregando configuração..." />;
  }

  // Verificar se o feature está habilitado
  const isEnabled =
    feature === "chapter" ? isChapterEnabled : isRetroEnabled;

  // Se não estiver habilitado, redirecionar para dashboard com toast
  if (!isEnabled) {
    const featureName = FEATURE_NAMES[feature];
    toast.error(
      `Módulo ${featureName} desabilitado pelo administrador`,
      { duration: 4000 }
    );
    return <Navigate to="/dashboard" replace />;
  }

  // Se habilitado, renderizar o componente filho
  return <>{children}</>;
}

export default FeatureProtectedRoute;
