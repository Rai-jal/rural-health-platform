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
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Calendar,
  Users,
  Clock,
  Star,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DoctorHeader } from "@/components/doctor-header";

interface DoctorStats {
  todaysConsultations: number;
  pendingConsultations: number;
  totalPatients: number;
  rating: number;
  totalConsultations: number;
  upcomingConsultations: Array<{
    id: string;
    scheduled_at: string;
    consultation_type: string;
    status: string;
    users: {
      id: string;
      full_name: string;
      email: string;
    };
  }>;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not doctor
    if (!authLoading && (!isLoggedIn || user?.role !== "Doctor")) {
      router.push("/unauthorized");
      return;
    }

    // Fetch stats if authenticated as doctor
    if (isLoggedIn && user?.role === "Doctor") {
      fetchStats();
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/doctor/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching doctor stats:", err);
      setError("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={fetchStats}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background">
      <DoctorHeader
        title="Dashboard Overview"
        description={`Welcome back, Dr. ${user?.full_name || "Doctor"}`}
      />

      {/* Stats Overview */}
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today&apos;s Consultations</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.todaysConsultations ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Scheduled for today</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Consultations</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.pendingConsultations ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Awaiting your response</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Patients</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.totalPatients ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>All time patients</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Your Rating</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.rating ? stats.rating.toFixed(1) : "0.0"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                <span>Average rating</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Your professional statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Total Consultations
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.totalConsultations}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Patient Base</p>
                  <p className="text-2xl font-bold">{stats.totalPatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Consultations */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Consultations</CardTitle>
            <CardDescription>Your scheduled consultations</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && stats.upcomingConsultations.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">
                          {consultation.users?.full_name || "Patient"}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {consultation.consultation_type}
                        </Badge>
                        <Badge
                          variant={
                            consultation.status === "scheduled"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {consultation.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(consultation.scheduled_at)}
                      </p>
                      {consultation.users?.email && (
                        <p className="text-xs text-gray-500 mt-1">
                          {consultation.users.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No upcoming consultations</p>
                <p className="text-sm mt-2">
                  Consultations will appear here when patients book with you
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
