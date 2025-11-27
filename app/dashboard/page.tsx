import { requireAuth } from "@/lib/auth/require-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Shield,
  Stethoscope,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Redirect based on role
  if (user.role === "Admin") {
    redirect("/admin");
  }
  if (user.role === "Doctor") {
    redirect("/doctor");
  }

  // Patient dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.full_name}!
              </h1>
              <p className="text-gray-600 mt-2">Your HealthConnect Dashboard</p>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Patient</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Upcoming Consultations</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Health Content Viewed</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Community Groups</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Payments</CardDescription>
              <CardTitle className="text-2xl">Le 0</CardTitle>
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
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No consultations yet</p>
                <Link href="/consultation">
                  <Button className="mt-4">Book Your First Consultation</Button>
                </Link>
              </div>
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
