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
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Stethoscope, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { DoctorHeader } from "@/components/doctor-header";
import type { NotificationPreference } from "@/lib/types/auth";
import { NotificationPreferences } from "@/components/notification-preferences";

interface ProviderProfile {
  id: string;
  full_name: string;
  specialty: string;
  languages: string[];
  experience_years: number;
  rating: number;
  total_consultations: number;
  location?: string;
  is_available: boolean;
}

export default function DoctorProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    specialty: "",
    languages: "",
    experience_years: 0,
    location: "",
    is_available: true,
  });
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference>("sms");

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.role !== "Doctor")) {
      router.push("/unauthorized");
      return;
    }

    if (isLoggedIn && user?.role === "Doctor") {
      fetchProfile();
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/doctor/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data.provider);
      if (data.provider) {
        setFormData({
          full_name: data.provider.full_name || "",
          specialty: data.provider.specialty || "",
          languages: data.provider.languages?.join(", ") || "",
          experience_years: data.provider.experience_years || 0,
          location: data.provider.location || "",
          is_available: data.provider.is_available ?? true,
        });
      }
      // Get user notification preferences
      if (data.user?.notification_preferences) {
        setNotificationPreference(data.user.notification_preferences);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        languages: formData.languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        notification_preferences: notificationPreference,
      };

      const response = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      fetchProfile();
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

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DoctorHeader
        title="Profile Settings"
        description="Manage your professional profile"
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your professional details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Stethoscope className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {profile?.full_name || user?.full_name || "Doctor"}
                </p>
                <p className="text-sm text-gray-500">{profile?.specialty || "Specialty"}</p>
                <Badge className="mt-1">Healthcare Provider</Badge>
              </div>
            </div>
            {profile && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">
                      {profile.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Consultations</span>
                  <span className="font-semibold">
                    {profile.total_consultations}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Experience</span>
                  <span className="font-semibold">
                    {profile.experience_years} years
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge
                    variant={profile.is_available ? "default" : "secondary"}
                  >
                    {profile.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your professional information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty *</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  placeholder="e.g., General Practice, Pediatrics"
                  required
                />
              </div>
              <div>
                <Label htmlFor="experience_years">Experience (Years)</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_years: parseInt(e.target.value) || 0,
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
                  placeholder="e.g., Freetown, Sierra Leone"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="languages">Languages (comma-separated) *</Label>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) =>
                    setFormData({ ...formData, languages: e.target.value })
                  }
                  placeholder="English, French, Krio"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple languages with commas
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) =>
                    setFormData({ ...formData, is_available: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_available">
                  Available for consultations
                </Label>
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
            value={notificationPreference}
            onChange={setNotificationPreference}
          />
        </div>
      </div>
    </div>
  );
}

