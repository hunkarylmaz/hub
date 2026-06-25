import { requireBusinessContext } from "@/lib/session";
import { countUnreadNotifications } from "@/lib/db/repo/notifications";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { PanelSidebar } from "./PanelSidebar";
import { PanelTopbar } from "./PanelTopbar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, business, membershipRole } = await requireBusinessContext();
  const unreadCount = countUnreadNotifications(business.id);

  return (
    <div className="min-h-screen bg-surface-subtle">
      <PanelSidebar businessName={business.name} membershipRole={membershipRole} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <PanelTopbar user={user} businessSlug={business.slug} unreadCount={unreadCount} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      </div>
      <PwaInstallPrompt />
    </div>
  );
}
