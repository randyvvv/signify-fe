import { MainLayout } from "@/components/layout";

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold text-quaternary md:text-4xl">
          Ini Profile
        </h1>
        <p className="font-body text-grey">
          Manage your account and preferences
        </p>
      </div>
    </MainLayout>
  );
}
