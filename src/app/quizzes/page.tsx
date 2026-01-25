import { MainLayout } from "@/components/layout";

export default function QuizzesPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold text-quaternary md:text-4xl">
          Ini Quizzes
        </h1>
        <p className="font-body text-grey">
          Test your sign language knowledge
        </p>
      </div>
    </MainLayout>
  );
}
