// ==============================================================================
// ADMIN NAVIGATION CONTEXT
// Responsive mobile drawer navigation state management
// ==============================================================================

"use client";

import * as React from "react";

interface AdminNavContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const AdminNavContext = React.createContext<AdminNavContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <AdminNavContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </AdminNavContext.Provider>
  );
}

export function useAdminNav() {
  return React.useContext(AdminNavContext);
}
