"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, Trash2, Upload, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SignAvatarViewer } from "@/components/shared";
import { useEquippedAvatar } from "@/components/shared/avatar/useEquippedAvatar";

interface SignLanguageInfo {
  code: string;
  name: string;
  signGpt: boolean;
}

interface DictionaryEntry {
  id: string;
  word: string;
  signedLanguage: string;
  createdAt: string;
}

// File -> base64 (tanpa prefix data URL).
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function SignDictionaryPage() {
  const avatar = useEquippedAvatar();
  const [languages, setLanguages] = useState<SignLanguageInfo[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [lang, setLang] = useState("ase");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<DictionaryEntry[] | null>(null);
  const [preview, setPreview] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Form unggah (admin)
  const [word, setWord] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ languages: SignLanguageInfo[]; canEdit: boolean }>("/api/signs/languages"),
      api.get<{ signLanguage: string }>("/api/me/preferences"),
    ])
      .then(([info, prefs]) => {
        setLanguages(info.languages);
        setCanEdit(info.canEdit);
        setLang(prefs.signLanguage ?? "ase");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({ lang });
    if (search.trim()) q.set("search", search.trim());
    const t = setTimeout(() => {
      api
        .get<DictionaryEntry[]>(`/api/signs?${q}`)
        .then((rows) => !cancelled && setEntries(rows))
        .catch(() => !cancelled && setEntries([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [lang, search, reloadKey]);

  const upload = async () => {
    if (!word.trim() || !file) {
      toast.error("Enter a word and choose a .pose file");
      return;
    }
    setUploading(true);
    try {
      const pose = await fileToBase64(file);
      await api.post("/api/signs", { word: word.trim(), signedLanguage: lang, pose });
      toast.success(`Saved "${word.trim()}"`);
      setPreview(word.trim());
      setWord("");
      setFile(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof ApiError ? err.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const remove = async (entry: DictionaryEntry) => {
    try {
      await api.del(`/api/signs/${entry.id}`);
      setEntries((rows) => rows?.filter((r) => r.id !== entry.id) ?? null);
      if (preview === entry.word) setPreview("");
    } catch (err) {
      toast.error("Delete failed", {
        description: err instanceof ApiError ? err.message : undefined,
      });
    }
  };

  const current = languages.find((l) => l.code === lang);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 shadow-sm">
        <Link
          href="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6 text-black" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-black">Sign Dictionary</h1>
          <p className="text-sm text-grey">
            Custom signs the avatar uses before falling back to SignGPT
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="flex flex-col gap-4 rounded-[20px] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a word..."
                className="h-11 w-full rounded-[10px] border border-gray-300 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-quinary/50"
              />
            </div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-11 rounded-[10px] border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-quinary/50"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {current && (
            <p className="text-xs text-grey">
              {current.signGpt
                ? "Words not in this dictionary are translated by SignGPT."
                : "Only words in this dictionary can be signed in this language."}
            </p>
          )}

          <div className="flex flex-col divide-y divide-gray-100">
            {entries === null ? (
              <p className="py-8 text-center text-sm text-grey">Loading...</p>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-sm text-grey">
                No signs in the dictionary yet.
              </p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                  <button
                    onClick={() => setPreview(entry.word)}
                    className={cn(
                      "flex items-center gap-3 text-left font-medium capitalize text-quaternary hover:text-quinary",
                      preview === entry.word && "text-quinary",
                    )}
                  >
                    <Play className="h-4 w-4" />
                    {entry.word}
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => remove(entry)}
                      aria-label={`Delete ${entry.word}`}
                      className="rounded-lg p-2 text-grey hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preview + upload */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[20px] bg-white p-6 shadow-sm">
            <h3 className="mb-1 font-heading text-lg font-bold text-quaternary">Preview</h3>
            <p className="mb-4 text-sm text-grey">
              {preview ? (
                <>
                  Signing <span className="font-bold capitalize text-quaternary">{preview}</span>
                </>
              ) : (
                "Pick a word to see the avatar sign it"
              )}
            </p>
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-senary/30">
              <SignAvatarViewer
                text={preview}
                signedLanguage={lang}
                vrmUrl={avatar.vrmUrl}
                hairColor={avatar.hairColor}
                eyeColor={avatar.eyeColor}
                accessory={avatar.accessory}
                className="h-full w-full"
                placeholder="Pick a word from the list"
              />
            </div>
          </div>

          {canEdit && (
            <div className="rounded-[20px] bg-white p-6 shadow-sm">
              <h3 className="mb-1 font-heading text-lg font-bold text-quaternary">
                Add a sign
              </h3>
              <p className="mb-4 text-sm text-grey">
                Upload a <code>.pose</code> file (pose-format v0.1/v0.2) for{" "}
                {current?.name ?? lang}. An existing word is replaced.
              </p>
              <div className="flex flex-col gap-3">
                <input
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Word or phrase, e.g. terima kasih"
                  className="h-11 rounded-[10px] border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-quinary/50"
                />
                <input
                  type="file"
                  accept=".pose"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-grey file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-medium file:text-quaternary"
                />
                <Button
                  onClick={upload}
                  disabled={uploading}
                  className="h-11 rounded-[10px] bg-quinary font-semibold text-white hover:bg-quinary/90"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Save sign"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
