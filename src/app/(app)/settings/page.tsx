"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface Preferences {
  notifications: boolean;
  soundEffects: boolean;
  autoplay: boolean;
  language: string;
}

const LANGUAGES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
];

function Toggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        enabled ? "bg-quinary" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [prefs, setPrefs] = useState<Preferences | null>(null);

  // change-password form
  const [showPwd, setShowPwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    api
      .get<Preferences>("/api/me/preferences")
      .then(setPrefs)
      .catch(() => toast.error("Gagal memuat preferensi"));
  }, []);

  const updatePref = async (patch: Partial<Preferences>) => {
    if (!prefs) return;
    const prev = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next); // optimistic
    try {
      await api.put("/api/me/preferences", patch);
    } catch {
      setPrefs(prev); // revert
      toast.error("Gagal menyimpan preferensi");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    setSavingPwd(true);
    try {
      await api.post("/api/me/password", { currentPassword, newPassword });
      toast.success("Password berhasil diubah");
      setShowPwd(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengubah password";
      toast.error("Gagal mengubah password", { description: msg });
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-black" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-black">Settings</h1>
            <p className="text-sm text-grey">Manage your preferences</p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex flex-col gap-4">
          {/* General Settings */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-black">General</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Notifications</p>
                  <p className="text-sm text-grey">Receive updates and reminders</p>
                </div>
                <Toggle
                  enabled={prefs?.notifications ?? false}
                  onClick={() =>
                    updatePref({ notifications: !prefs?.notifications })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Sound Effects</p>
                  <p className="text-sm text-grey">
                    Play sounds for actions and feedback
                  </p>
                </div>
                <Toggle
                  enabled={prefs?.soundEffects ?? false}
                  onClick={() =>
                    updatePref({ soundEffects: !prefs?.soundEffects })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Autoplay Videos</p>
                  <p className="text-sm text-grey">
                    Automatically play learning videos
                  </p>
                </div>
                <Toggle
                  enabled={prefs?.autoplay ?? false}
                  onClick={() => updatePref({ autoplay: !prefs?.autoplay })}
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-black">Account</h2>
            <div className="space-y-3">
              <Link
                href="/profile"
                className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50"
              >
                <span className="font-medium text-black">Edit Profile</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </Link>

              <button
                onClick={() => setShowPwd((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-black">Change Password</span>
                <ChevronRight
                  className={`h-5 w-5 text-grey transition-transform ${showPwd ? "rotate-90" : ""}`}
                />
              </button>
              {showPwd && (
                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-quinary/20"
                  />
                  <input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-quinary/20"
                  />
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPwd}
                    className="bg-quinary text-white hover:bg-quinary/90"
                  >
                    {savingPwd ? "Saving..." : "Update Password"}
                  </Button>
                </div>
              )}

              <div className="flex w-full items-center justify-between rounded-lg p-3">
                <span className="font-medium text-black">Language</span>
                <select
                  value={prefs?.language ?? "en"}
                  onChange={(e) => updatePref({ language: e.target.value })}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-sm text-grey focus:outline-none focus:ring-2 focus:ring-quinary/20"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-black">
              Privacy & Security
            </h2>
            <div className="space-y-3">
              <Link
                href="/privacy-policy"
                className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-black">Privacy Policy</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </Link>
              <Link
                href="/terms-of-service"
                className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-black">Terms of Service</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </Link>
            </div>
          </div>

          {/* About */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-black">About</h2>
            <div className="space-y-3">
              <Link
                href="/about"
                className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-black">About Signify</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </Link>
              <div className="rounded-lg p-3">
                <span className="text-sm text-grey">Version 1.0.0</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
