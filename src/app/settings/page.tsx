"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoplay, setAutoplay] = useState(false);

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
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Notifications</p>
                  <p className="text-sm text-grey">
                    Receive updates and reminders
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications ? "bg-quinary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      notifications ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Sound Effects</p>
                  <p className="text-sm text-grey">
                    Play sounds for actions and feedback
                  </p>
                </div>
                <button
                  onClick={() => setSoundEffects(!soundEffects)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    soundEffects ? "bg-quinary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      soundEffects ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Autoplay Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">Autoplay Videos</p>
                  <p className="text-sm text-grey">
                    Automatically play learning videos
                  </p>
                </div>
                <button
                  onClick={() => setAutoplay(!autoplay)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    autoplay ? "bg-quinary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      autoplay ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
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
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50">
                <span className="font-medium text-black">Change Password</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </button>
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50">
                <span className="font-medium text-black">Language</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-grey">English</span>
                  <ChevronRight className="h-5 w-5 text-grey" />
                </div>
              </button>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-black">
              Privacy & Security
            </h2>
            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50">
                <span className="font-medium text-black">Privacy Policy</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </button>
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50">
                <span className="font-medium text-black">
                  Terms of Service
                </span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </button>
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50">
                <span className="font-medium text-black">Data Management</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </button>
            </div>
          </div>

          {/* About */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-black">About</h2>
            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50">
                <span className="font-medium text-black">Help & Support</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </button>
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50">
                <span className="font-medium text-black">About Signify</span>
                <ChevronRight className="h-5 w-5 text-grey" />
              </button>
              <div className="rounded-lg p-3">
                <span className="text-sm text-grey">Version 1.0.0</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <Button
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
