"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

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
                      src="/profile/avatar.png"
                      alt="Thea Josephine"
                    />Thea Josephine
                    <AvatarFallback className="text-2xl">TJ</AvatarFallback>
                  </Avatar>
                </div>
                <div className="mb-2">
                  <h2 className="text-lg font-medium text-black">
                    Thea Josephine
                  </h2>
                  <p className="text-sm font-normal text-grey">thea.josephine@example.com</p>
                  <div className="mt-2 flex w-fit items-center gap-1 rounded-full bg-senary px-3 py-1 text-sm font-bold text-white">
                    <span>67</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
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
                  <label className="text-sm font-bold text-black">
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Your First Name"
                    className="w-full rounded-lg bg-gray-100 p-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-black">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      disabled={!isEditing}
                      className="w-full appearance-none rounded-lg bg-gray-100 p-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option>Your Gender</option>{" "}
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg
                        className="h-4 w-4 fill-current"
                        viewBox="0 0 20 20"
                      >
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
                  disabled={!isEditing}
                  placeholder="Your Email Address"
                  className="w-full rounded-lg bg-gray-100 p-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-black">Bio</label>
                <textarea
                  disabled={!isEditing}
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
                    onClick={() => setIsEditing(false)}
                    className="w-full border-black px-8 text-black hover:bg-black/5 sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    className="w-full bg-quinary px-8 text-white hover:bg-quinary/90 sm:w-auto"
                  >
                    Save
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
