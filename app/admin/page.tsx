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

  // Format currency in Leone (Le)
  const formatCurrency = (amount: number) => {
    return `Le ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
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
            <CardTitle className="text-destructive">Error</CardTitle>
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
      {/* Header */}
      <AdminHeader
        title={`Welcome, ${user?.full_name || "Admin"}`}
      />

      {/* Stats Overview */}
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-bold">Total Users</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.totalUsers ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>All registered users</span>
                </div>
                {stats && stats.recentUsers > 0 && (
                  <div className="flex items-center text-xs text-primary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+{stats.recentUsers} this week</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-bold">Total Consultations</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.totalConsultations ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>All time consultations</span>
                </div>
                {stats && stats.recentConsultations > 0 && (
                  <div className="flex items-center text-xs text-primary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+{stats.recentConsultations} this week</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-bold">Total Revenue</CardDescription>
              <CardTitle className="text-2xl">
                {stats ? formatCurrency(stats.totalRevenue) : "Le 0"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Le Total payments received</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-bold">Healthcare Providers</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.totalHealthcareProviders ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pending Consultations
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.pendingConsultations}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Completed Consultations
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.completedConsultations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
