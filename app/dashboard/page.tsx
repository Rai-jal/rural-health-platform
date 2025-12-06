"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Phone,
  BookOpen,
  CreditCard,
  Users,
  Calendar,
  Heart,
  User,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PatientStats {
  upcomingConsultations: number;
  healthContentViewed: number;
  communityGroups: number;
  totalPayments: number;
  totalConsultations: number;
  recentConsultations: Array<{
    id: string;
    scheduled_at: string;
    consultation_type: string;
    status: string;
    cost_leone: number;
    healthcare_providers: {
      id: string;
      full_name: string;
      specialty: string;
    };
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect based on role
    if (!authLoading && isLoggedIn) {
      if (user?.role === "Admin") {
        router.push("/admin");
        return;
      }
      if (user?.role === "Doctor") {
        router.push("/doctor");
        return;
      }
    }

    // Redirect to login if not authenticated
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    // Fetch stats if authenticated as patient
    if (isLoggedIn && user?.role === "Patient") {
      fetchStats();
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/patient/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching patient stats:", err);
      setError("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
    })
      .format(amount)
      .replace("SLL", "Le");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
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

  // Patient dashboard
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name || "Patient"}!
            </h1>
            <p className="text-gray-600 mt-2">Your HealthConnect Dashboard</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Upcoming Consultations</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.upcomingConsultations ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Health Content Viewed</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.healthContentViewed ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Community Groups</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.communityGroups ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Payments</CardDescription>
              <CardTitle className="text-2xl">
                {stats ? formatCurrency(stats.totalPayments) : "Le 0"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/consultation">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Phone className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Book Consultation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center">
                    Schedule a consultation with a healthcare provider
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/education">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <BookOpen className="h-10 w-10 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Health Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center">
                    Access health education content in your language
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/payments">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <CreditCard className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center">
                    View payment history and make payments
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/community">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Users className="h-10 w-10 text-orange-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center">
                    Join support groups and connect with others
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Consultations</CardTitle>
              <CardDescription>
                Your recent healthcare consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.recentConsultations.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentConsultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            {consultation.healthcare_providers?.full_name ||
                              "Healthcare Provider"}
                          </p>
                          <Badge variant="outline">
                            {consultation.consultation_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {consultation.healthcare_providers?.specialty} •{" "}
                          {formatDate(consultation.scheduled_at)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(consultation.cost_leone)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          consultation.status === "completed"
                            ? "default"
                            : consultation.status === "scheduled"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {consultation.status}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/consultation">
                    <Button variant="outline" className="w-full mt-4">
                      View All Consultations
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No consultations yet</p>
                  <Link href="/consultation">
                    <Button className="mt-4">Book Your First Consultation</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Tips</CardTitle>
              <CardDescription>
                Personalized health recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Heart className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Stay Hydrated</p>
                    <p className="text-sm text-gray-600">
                      Drink at least 8 glasses of water daily
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Heart className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Regular Exercise</p>
                    <p className="text-sm text-gray-600">
                      30 minutes of daily activity recommended
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Heart className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Balanced Diet</p>
                    <p className="text-sm text-gray-600">
                      Eat a variety of nutritious foods
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
