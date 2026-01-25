import { MainLayout } from "@/components/layout";

export default function LearningMaterialsPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold text-quaternary md:text-4xl">
          Ini Learning Materials
        </h1>
        <p className="font-body text-grey">
          Explore our comprehensive sign language learning resources
        </p>
      </div>
    </MainLayout>
  );
}
