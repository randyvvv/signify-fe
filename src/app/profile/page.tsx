"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [bio, setBio] = useState("");

  // Isi form dari user.
  const resetForm = () => {
    setFullName(user?.fullName ?? "");
    setGender((user?.gender as "male" | "female" | undefined) ?? "");
    setBio(user?.bio ?? "");
  };

  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/me", {
        fullName: fullName.trim() || undefined,
        gender: gender || undefined,
        bio: bio,
      });
      await refresh();
      toast.success("Profil tersimpan");
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan profil";
      toast.error("Gagal menyimpan", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
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
            <h1 className="text-xl font-bold text-black">
              {isEditing ? "Edit Profile" : "My Profile"}
            </h1>
            <p className="text-sm text-grey">Your own profile</p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="overflow-hidden bg-white shadow-sm">
          {/* Banner Gradient */}
          <div className="h-24 w-full bg-linear-to-r from-[#C5FBF9] to-[#FFFADA]"></div>

          <div className="flex justify-left px-8 pb-8">
            <div className="w-full max-w-3xl">
              <div className="relative mt-6 mb-6 flex items-end justify-between">
                <div className="flex items-end gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-sm bg-orange-200">
                      <AvatarImage
                        src={user?.avatarUrl ?? undefined}
                        alt={user?.fullName ?? "User"}
                      />
                      <AvatarFallback className="text-2xl">
                        {initials(user?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="mb-2">
                    <h2 className="text-lg font-medium text-black">
                      {user?.fullName ?? "User"}
                    </h2>
                    <p className="text-sm font-normal text-grey">{user?.email}</p>
                    <div className="mt-2 flex w-fit items-center gap-1 rounded-full bg-senary px-3 py-1 text-sm font-bold text-white">
                      <span>{user?.coins ?? 0}</span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/profile/coins-1.png" alt="Coins" className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="mb-4 bg-quinary px-6 font-medium text-white hover:bg-quinary/90"
                  >
                    Edit
                  </Button>
                )}
              </div>

              {/* Form */}
              <div className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-black">Full Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full rounded-lg bg-gray-100 p-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-black">Gender</label>
                    <div className="relative">
                      <select
                        disabled={!isEditing}
                        value={gender}
                        onChange={(e) =>
                          setGender(e.target.value as "" | "male" | "female")
                        }
                        className="w-full appearance-none rounded-lg bg-gray-100 p-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <option value="">Your Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                            fillRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-black">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email ?? ""}
                    className="w-full rounded-lg bg-gray-100 p-3 text-sm text-black placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-black">Bio</label>
                  <textarea
                    disabled={!isEditing}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Your Bio"
                    rows={4}
                    className="w-full resize-none rounded-lg bg-gray-100 p-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsEditing(false);
                      }}
                      disabled={saving}
                      className="w-full border-black px-8 text-black hover:bg-black/5 sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full bg-quinary px-8 text-white hover:bg-quinary/90 sm:w-auto"
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
