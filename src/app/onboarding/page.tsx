import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { findBusinessByOwnerId } from "@/lib/db/repo/businesses";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const user = await requireRole(["OWNER"]);

  if (findBusinessByOwnerId(user.id)) {
    redirect("/panel");
  }

  return <OnboardingWizard ownerName={user.fullName} />;
}
