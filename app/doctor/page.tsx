import { requireAuth } from "@/lib/auth/require-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  Calendar,
  Users,
  Clock,
  MessageSquare,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default async function DoctorDashboard() {
  const user = await requireAuth("Doctor");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Doctor Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome, Dr. {user.full_name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Healthcare Provider
              </span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today&apos;s Consultations</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
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
              <CardTitle className="text-2xl">0</CardTitle>
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
              <CardTitle className="text-2xl">0</CardTitle>
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
              <CardTitle className="text-2xl">0.0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <span>⭐ Average rating</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Features</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Manage Consultations</CardTitle>
                <CardDescription>
                  View and manage patient consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li>• View scheduled consultations</li>
                  <li>• Accept/decline requests</li>
                  <li>• Update consultation status</li>
                  <li>• Add consultation notes</li>
                </ul>
                <Button variant="outline" className="w-full">
                  View Consultations
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>My Patients</CardTitle>
                <CardDescription>
                  View your patient list and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li>• View patient profiles</li>
                  <li>• Consultation history</li>
                  <li>• Medical records</li>
                  <li>• Patient communication</li>
                </ul>
                <Button variant="outline" className="w-full">
                  View Patients
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                  Manage your professional profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li>• Update specialty</li>
                  <li>• Set availability</li>
                  <li>• Manage languages</li>
                  <li>• View statistics</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Consultations */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Consultations</CardTitle>
            <CardDescription>Your scheduled consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No upcoming consultations</p>
              <p className="text-sm mt-2">
                Consultations will appear here when patients book with you
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
