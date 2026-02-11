import { redirect } from "next/navigation";
import { auth } from "~/auth/dashboard-config";
import { PaymentsTable } from "~/components/dashboard/payments-table";
import { getPayments } from "~/db/services/payment-services";
import { isAdmin } from "~/lib/auth/check-access";

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.dashboardUser) {
    redirect("/dashboard/login");
  }

  if (!isAdmin(session.dashboardUser)) {
    redirect("/dashboard");
  }

  const initialData = await getPayments({ page: 1, limit: 20 });

  const serializedData = {
    ...initialData,
    payments: initialData.payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">View and manage all payments</p>
        </div>
      </div>

      <PaymentsTable initialData={serializedData} />
    </div>
  );
}
