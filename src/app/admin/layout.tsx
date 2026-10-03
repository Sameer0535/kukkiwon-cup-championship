// ==============================================================================
// ADMIN ROOT LAYOUT (Requirement 21)
// Protected layout housing sidebar and administrative controls
// ==============================================================================

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminNavProvider } from "@/components/layout/admin-nav-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminNavProvider>
      <div className="flex min-h-screen bg-[#090D16]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AdminNavProvider>
  );
}

