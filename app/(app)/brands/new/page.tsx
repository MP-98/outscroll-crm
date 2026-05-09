import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { BrandForm } from "@/components/forms/brand-form";

export const metadata = { title: "New brand" };

export default async function NewBrandPage() {
  await requireProfile();
  return (
    <>
      <PageHeader title="New brand" subtitle="Track a brand you're pitching." />
      <div className="px-5 py-5">
        <BrandForm />
      </div>
    </>
  );
}
