import { requireBusinessContext } from "@/lib/session";
import { findStaffByUserId, calculateStaffEarnings } from "@/lib/db/repo/staff";
import { combineDateTime, todayKey } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { KazanclarimClient } from "./KazanclarimClient";

export default async function KazanclarimPage() {
  const { user } = await requireBusinessContext();
  const staff = findStaffByUserId(user.id);

  const today = todayKey();
  const [y, m] = today.split("-").map(Number);
  const nextMonthKey = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const monthStartIso = combineDateTime(`${y}-${String(m).padStart(2, "0")}-01`, "00:00");
  const monthEndIso = combineDateTime(nextMonthKey, "00:00");

  const monthEarnings = staff ? calculateStaffEarnings(staff.id, monthStartIso, monthEndIso) : null;
  const allTimeEarnings = staff ? calculateStaffEarnings(staff.id) : null;

  return (
    <div>
      <PageHeader title="Kazançlarım" description="Tamamladığın işlemler ve kazancın" />
      <KazanclarimClient staff={staff} monthEarnings={monthEarnings} allTimeEarnings={allTimeEarnings} />
    </div>
  );
}
