import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ManagedBrandForm } from "@/components/forms/managed-brand-form";

export const metadata = { title: "New managed brand" };

export default async function NewManagedBrandPage() {
  await requireProfile();
  return (
    <>
      <PageHeader
        title="New managed brand"
        subtitle="Add a brand whose Instagram Outscroll manages."
      />
      <div className="px-5 py-5">
        <ManagedBrandForm />
      </div>
    </>
  );
}
