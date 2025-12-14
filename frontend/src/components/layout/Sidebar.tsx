import { cn } from "@/utils/cn";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useConfig } from "@/contexts/ConfigContext";
import { useAuthStore } from "@/stores/authStore";

interface SubMenuItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  badge?: number;
  subItems?: SubMenuItem[];
  requiresAdmin?: boolean;
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { isChapterEnabled, isRetroEnabled } = useConfig();
  const { user } = useAuthStore();
  const location = useLocation();

  const isAdmin = user?.is_staff || false;

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    // Chapter - menu expansível
    ...(isChapterEnabled
      ? [
          {
            label: "Chapter",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            ),
            subItems: [
              { label: "Temas", path: "/ideas" },
              { label: "Calendário", path: "/calendar" },
              { label: "Timeline", path: "/timeline" },
            ],
          },
        ]
      : []),
    // Retro - menu expansível
    ...(isRetroEnabled
      ? [
          {
            label: "Retro",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
            subItems: [
              { label: "Retrospectivas", path: "/retros" },
              { label: "Templates", path: "/retros/templates" },
              { label: "Métricas", path: "/retros/metrics" },
            ],
          },
        ]
      : []),
    // Perfil
    {
      label: "Perfil",
      path: "/profile",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    // Configuração (apenas admin)
    ...(isAdmin
      ? [
          {
            label: "Configuração",
            path: "/config",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ),
            requiresAdmin: true,
          },
        ]
      : []),
  ];

  // Auto-expandir menu pai quando a rota atual corresponder a um submenu
  useEffect(() => {
    const currentPath = location.pathname;
    
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some((subItem) => 
          currentPath === subItem.path || currentPath.startsWith(subItem.path + "/")
        );
        
        if (hasActiveSubItem && !expandedMenus.includes(item.label)) {
          setExpandedMenus((prev) => [...prev, item.label]);
        }
      }
    });
  }, [location.pathname]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
        "transition-all duration-300 z-30",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Chapterly" className="w-8 h-8" />
            <span className="font-bold text-gray-900 dark:text-gray-100">
              Chapterly
            </span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
            "text-gray-500 dark:text-gray-400",
            isCollapsed && "mx-auto",
          )}
          aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          <svg
            className={cn(
              "w-5 h-5 transition-transform",
              isCollapsed && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.label}>
            {/* Item sem submenu ou link direto */}
            {!item.subItems && item.path && (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg transition-colors",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    isActive &&
                      "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium",
                    isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            )}

            {/* Item com submenu (expansível) */}
            {item.subItems && (
              <div>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg transition-colors",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!isCollapsed && (
                    <>
                      <span className="text-sm flex-1 text-left">{item.label}</span>
                      <svg
                        className={cn(
                          "w-4 h-4 transition-transform",
                          expandedMenus.includes(item.label) && "rotate-180",
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>

                {/* Subitems */}
                {!isCollapsed && expandedMenus.includes(item.label) && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.subItems.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        end
                        className={({ isActive }) =>
                          cn(
                            "block px-3 py-2 rounded-lg transition-colors text-sm",
                            "text-gray-600 dark:text-gray-400",
                            "hover:bg-gray-100 dark:hover:bg-gray-700",
                            isActive &&
                              "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium",
                          )
                        }
                      >
                        {subItem.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer - User info */}
      {/*<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                Usuário
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Ver perfil
              </p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            U
          </div>
        )}
      </div>*/}
    </aside>
  );
}
