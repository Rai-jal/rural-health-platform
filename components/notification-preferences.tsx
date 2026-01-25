"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Mail, MessageSquare } from "lucide-react";
import type { NotificationPreference } from "@/lib/types/auth";
import { getPreferenceDisplayName, getPreferenceDescription } from "@/lib/notifications/preferences";

interface NotificationPreferencesProps {
  value: NotificationPreference;
  onChange: (value: NotificationPreference) => void;
}

export function NotificationPreferences({
  value,
  onChange,
}: NotificationPreferencesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          {/* SMS Only Option */}
          <div
            className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all ${
              value === "sms"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onChange("sms")}
          >
            <input
              type="radio"
              name="notification_preferences"
              value="sms"
              checked={value === "sms"}
              onChange={() => onChange("sms")}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">SMS Only</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications via SMS only
              </p>
            </div>
            {value === "sms" && (
              <div className="absolute top-2 right-2">
                <div className="h-4 w-4 rounded-full bg-primary"></div>
              </div>
            )}
          </div>

          {/* Email Only Option */}
          <div
            className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all ${
              value === "email"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onChange("email")}
          >
            <input
              type="radio"
              name="notification_preferences"
              value="email"
              checked={value === "email"}
              onChange={() => onChange("email")}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Email Only</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications via Email only
              </p>
            </div>
            {value === "email" && (
              <div className="absolute top-2 right-2">
                <div className="h-4 w-4 rounded-full bg-primary"></div>
              </div>
            )}
          </div>

          {/* Both Option */}
          <div
            className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all ${
              value === "both"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onChange("both")}
          >
            <input
              type="radio"
              name="notification_preferences"
              value="both"
              checked={value === "both"}
              onChange={() => onChange("both")}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">SMS & Email</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications via both SMS and Email
              </p>
            </div>
            {value === "both" && (
              <div className="absolute top-2 right-2">
                <div className="h-4 w-4 rounded-full bg-primary"></div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Current setting:</strong>{" "}
            {getPreferenceDisplayName(value)} -{" "}
            {getPreferenceDescription(value)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
