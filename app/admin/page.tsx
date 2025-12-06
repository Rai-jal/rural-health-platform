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
import {
  Users,
  Calendar,
  DollarSign,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AdminHeader } from "@/components/admin-header";

interface AdminStats {
  totalUsers: number;
  totalConsultations: number;
  totalRevenue: number;
  totalHealthcareProviders: number;
  pendingConsultations: number;
  completedConsultations: number;
  recentUsers: number;
  recentConsultations: number;
  usersByRole: {
    patients: number;
    doctors: number;
    admins: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not admin
    if (!authLoading && (!isLoggedIn || user?.role !== "Admin")) {
      router.push("/unauthorized");
      return;
    }

    // Fetch stats if authenticated as admin
    if (isLoggedIn && user?.role === "Admin") {
      fetchStats();
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setError("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
    })
      .format(amount)
      .replace("SLL", "Le");
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
    <div className="p-6">
      {/* Header */}
      <AdminHeader
        title="Dashboard Overview"
        description={`Welcome back, ${user?.full_name || "Admin"}`}
      />

      {/* Stats Overview */}
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.totalUsers ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span>All registered users</span>
                </div>
                {stats && stats.recentUsers > 0 && (
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+{stats.recentUsers} this week</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Consultations</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.totalConsultations ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>All time consultations</span>
                </div>
                {stats && stats.recentConsultations > 0 && (
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+{stats.recentConsultations} this week</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl">
                {stats ? formatCurrency(stats.totalRevenue) : "Le 0"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>Total payments received</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Healthcare Providers</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.totalHealthcareProviders ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>Active providers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Insights</CardTitle>
              <CardDescription>Detailed platform metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Pending Consultations
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.pendingConsultations}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Completed Consultations
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.completedConsultations}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Users by Role</p>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Patients:</span>{" "}
                      <span className="font-semibold">
                        {stats.usersByRole.patients}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Doctors:</span>{" "}
                      <span className="font-semibold">
                        {stats.usersByRole.doctors}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Admins:</span>{" "}
                      <span className="font-semibold">
                        {stats.usersByRole.admins}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
