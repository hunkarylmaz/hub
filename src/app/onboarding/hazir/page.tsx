import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { findBusinessBySlug } from "@/lib/db/repo/businesses";
import { HazirClient } from "./HazirClient";

export default async function OnboardingHazirPage({ searchParams }: { searchParams: { slug?: string } }) {
  const user = await requireRole(["OWNER"]);

  const slug = searchParams.slug;
  if (!slug) redirect("/onboarding");

  const business = findBusinessBySlug(slug);
  if (!business || business.ownerUserId !== user.id) redirect("/onboarding");

  return <HazirClient businessName={business.name} slug={business.slug} />;
}
