import { requireSuperAdmin } from "@/lib/session";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-surface-subtle">
      <AdminSidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <AdminTopbar user={user} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      </div>
      <PwaInstallPrompt />
    </div>
  );
}
