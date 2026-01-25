import { MainLayout } from "@/components/layout";

export default function LiveTranslatorPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold text-quaternary md:text-4xl">
          Ini Live Translator
        </h1>
        <p className="font-body text-grey">
          Real-time sign language translation
        </p>
      </div>
    </MainLayout>
  );
}
