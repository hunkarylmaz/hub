import { requireOwnerContext } from "@/lib/session";
import { listIncomeRecords, listExpenseRecords, listAccountingCategories } from "@/lib/db/repo/accounting";
import { listServices } from "@/lib/db/repo/services";
import { listStaff } from "@/lib/db/repo/staff";
import { PageHeader } from "@/components/ui/PageHeader";
import { RaporlarClient } from "./RaporlarClient";

export default async function RaporlarPage() {
  const { business } = await requireOwnerContext();

  const income = listIncomeRecords(business.id);
  const expense = listExpenseRecords(business.id);
  const categories = listAccountingCategories(business.id);
  const services = listServices(business.id);
  const staff = listStaff(business.id);

  return (
    <div>
      <PageHeader title="Raporlar" description="Gelir-gider performansını ve kategori dağılımlarını incele" />
      <RaporlarClient income={income} expense={expense} categories={categories} services={services} staff={staff} />
    </div>
  );
}
