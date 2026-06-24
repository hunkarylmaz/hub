import { requireOwnerContext } from "@/lib/session";
import { listIncomeRecords, listExpenseRecords, listAccountingCategories } from "@/lib/db/repo/accounting";
import { listCustomers } from "@/lib/db/repo/customers";
import { listServices } from "@/lib/db/repo/services";
import { listStaff } from "@/lib/db/repo/staff";
import { PageHeader } from "@/components/ui/PageHeader";
import { GelirGiderClient } from "./GelirGiderClient";

export default async function GelirGiderPage() {
  const { business } = await requireOwnerContext();

  const income = listIncomeRecords(business.id);
  const expense = listExpenseRecords(business.id);
  const categories = listAccountingCategories(business.id);
  const customers = listCustomers(business.id);
  const services = listServices(business.id);
  const staff = listStaff(business.id);

  return (
    <div>
      <PageHeader title="Gelir-Gider" description="Tüm gelir ve gider kayıtlarını görüntüle ve yönet" />
      <GelirGiderClient
        income={income}
        expense={expense}
        categories={categories}
        customers={customers}
        services={services}
        staff={staff}
      />
    </div>
  );
}
