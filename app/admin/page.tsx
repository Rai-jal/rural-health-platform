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
  Shield,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const user = await requireAuth("Admin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Welcome, {user.full_name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">
                Administrator
              </span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>All registered users</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Consultations</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>All time consultations</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl">Le 0</CardTitle>
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
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>Active providers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Admin Features</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage all users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li>• View all users</li>
                  <li>• Change user roles</li>
                  <li>• Activate/deactivate users</li>
                  <li>• View user activity</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  View platform statistics and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li>• User growth metrics</li>
                  <li>• Consultation statistics</li>
                  <li>• Revenue reports</li>
                  <li>• Content performance</li>
                </ul>
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Settings className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li>• Manage healthcare providers</li>
                  <li>• Configure payment methods</li>
                  <li>• System configuration</li>
                  <li>• Content moderation</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Add New Healthcare Provider
              </Button>
              <Button variant="outline" className="justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Change User Role
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View All Consultations
              </Button>
              <Button variant="outline" className="justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                View Payment Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
