import { MainLayout } from "@/components/layout";

export default function SignPracticePage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold text-quaternary md:text-4xl">
          Ini Sign Practice
        </h1>
        <p className="font-body text-grey">
          Practice your sign language skills with interactive exercises
        </p>
      </div>
    </MainLayout>
  );
}
