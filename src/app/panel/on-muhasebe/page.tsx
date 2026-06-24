import { requireBusinessContext } from "@/lib/session";
import { listIncomeRecords, listExpenseRecords, listAccountingCategories } from "@/lib/db/repo/accounting";
import { listCustomers } from "@/lib/db/repo/customers";
import { listServices } from "@/lib/db/repo/services";
import { listStaff } from "@/lib/db/repo/staff";
import { PageHeader } from "@/components/ui/PageHeader";
import { OnMuhasebeClient } from "./OnMuhasebeClient";

export default async function OnMuhasebePage() {
  const { business } = await requireBusinessContext();

  const income = listIncomeRecords(business.id);
  const expense = listExpenseRecords(business.id);
  const categories = listAccountingCategories(business.id);
  const customers = listCustomers(business.id);
  const services = listServices(business.id);
  const staff = listStaff(business.id);

  return (
    <div>
      <PageHeader title="Ön Muhasebe" description="Günlük kasa durumunu ve tahsilatları takip et" />
      <OnMuhasebeClient
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
