import OfferingsCategoryPage from "@/components/admin/OfferingsCategoryPage";

type AdminOfferingsSearchParams = { q?: string; sort?: string; page?: string };

export default async function ClasesPage({ searchParams }: { searchParams?: Promise<AdminOfferingsSearchParams> }) {
  const params = await searchParams;

  return (
    <OfferingsCategoryPage
      title="Cursos"
      subtitle="Administra únicamente cursos"
      type="class"
      basePath="/admin/clases"
      typeLabel="Curso"
      emptyIcon="school"
      emptyTitle="No hay cursos creados todavía."
      emptyDescription="Crea el primer curso para empezar."
      createLabel="Crear nuevo curso"
      searchParams={params}
    />
  );
}
