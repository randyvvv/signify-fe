import { MainLayout } from "@/components/layout";

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold text-quaternary md:text-4xl">
          Ini Dashboard
        </h1>
        <p className="font-body text-grey">
          Welcome to your learning dashboard
        </p>
      </div>
    </MainLayout>
  );
}
