"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, User, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { AdminHeader } from "@/components/admin-header";
import type { NotificationPreference } from "@/lib/types/auth";
import { NotificationPreferences } from "@/components/notification-preferences";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    location: "",
    notification_preferences: "sms" as NotificationPreference,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (!authLoading && (!isLoggedIn || user?.role !== "Admin")) {
      router.push("/unauthorized");
      return;
    }

    // Initialize form data
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone_number: user.phone_number || "",
        location: user.location || "",
        notification_preferences: (user.notification_preferences || "sms") as NotificationPreference,
      });
    }
  }, [authLoading, isLoggedIn, user, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Profile updated successfully",
      });

      // Refresh user data
      window.location.reload();
    } catch (err) {
      console.error("Error updating profile:", err);
      addToast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminHeader
        title="Profile Settings"
        description="Update your admin profile information"
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.full_name || "Admin"}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <Badge className="mt-1">Administrator</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                    className="bg-muted/50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone_number: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={user?.role || "Admin"}
                  disabled
                    className="bg-muted/50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Role cannot be changed
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <div className="md:col-span-3">
          <NotificationPreferences
            value={formData.notification_preferences}
            onChange={(value) =>
              setFormData({ ...formData, notification_preferences: value })
            }
          />
        </div>
      </div>
    </div>
  );
}

