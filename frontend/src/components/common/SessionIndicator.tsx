import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
  user_id: number;
  [key: string]: any;
}

type SessionStatus = "healthy" | "warning" | "expiring" | "offline";

export function SessionIndicator() {
  const { token, isAuthenticated } = useAuthStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("healthy");
  const [showIndicator, setShowIndicator] = useState(false);

  // Monitorar status da conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Verificar status da sessão
  useEffect(() => {
    if (!token || !isAuthenticated) {
      setSessionStatus("healthy");
      return;
    }

    const checkSessionStatus = () => {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        if (!decoded?.exp) return;

        const expiryTime = decoded.exp * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry <= 0) {
          setSessionStatus("expiring");
        } else if (timeUntilExpiry < 5 * 60 * 1000) {
          // Menos de 5 minutos
          setSessionStatus("expiring");
        } else if (timeUntilExpiry < 10 * 60 * 1000) {
          // Menos de 10 minutos
          setSessionStatus("warning");
        } else {
          setSessionStatus("healthy");
        }
      } catch (error) {
        console.error("Erro ao verificar status da sessão:", error);
      }
    };

    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 30 * 1000); // Verificar a cada 30s

    return () => clearInterval(interval);
  }, [token, isAuthenticated]);

  // Mostrar indicador apenas quando houver problema
  useEffect(() => {
    if (
      !isOnline ||
      sessionStatus === "warning" ||
      sessionStatus === "expiring"
    ) {
      setShowIndicator(true);
    } else {
      setShowIndicator(false);
    }
  }, [isOnline, sessionStatus]);

  if (!isAuthenticated) {
    return null;
  }

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: "bg-red-500",
        text: "Sem conexão",
        textColor: "text-red-700 dark:text-red-300",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
      };
    }

    switch (sessionStatus) {
      case "expiring":
        return {
          icon: AlertCircle,
          color: "bg-amber-500",
          text: "Sessão expirando",
          textColor: "text-amber-700 dark:text-amber-300",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-200 dark:border-amber-800",
        };
      case "warning":
        return {
          icon: Clock,
          color: "bg-yellow-500",
          text: "Sessão ativa",
          textColor: "text-yellow-700 dark:text-yellow-300",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
        };
      case "healthy":
      default:
        return {
          icon: CheckCircle,
          color: "bg-green-500",
          text: "Conectado",
          textColor: "text-green-700 dark:text-green-300",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-40"
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg backdrop-blur-sm`}
          >
            {/* Pulse indicator */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`absolute inset-0 rounded-full ${config.color} opacity-25`}
              />
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
            </div>

            {/* Icon and text */}
            <Icon className={`w-4 h-4 ${config.textColor}`} />
            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.text}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SessionIndicator;
