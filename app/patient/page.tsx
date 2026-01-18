'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/navigation'
import {
  Phone,
  BookOpen,
  CreditCard,
  Users,
  Calendar,
  Heart,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export default function PatientDashboard() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || user.role !== 'Patient') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is for patients only.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Patient Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome, {user.full_name}! Manage your healthcare services here.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-sm text-muted-foreground mt-2">No upcoming appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Content Viewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">0</div>
              <p className="text-sm text-muted-foreground mt-2">Start learning today</p>
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/consultation">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <Phone className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Book Consultation</CardTitle>
                  <CardDescription>Schedule with a healthcare provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Book Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/education">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Health Education</CardTitle>
                  <CardDescription>Learn about health topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Explore <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/payments">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CreditCard className="h-10 w-10 text-orange-600 mb-2" />
                  <CardTitle>Payments</CardTitle>
                  <CardDescription>Manage your payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    View <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Patient Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-6 w-6 mr-2 text-green-600" />
              Your Features as a Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Book Consultations</h4>
                  <p className="text-sm text-muted-foreground">
                    Schedule video, voice, or SMS consultations with healthcare providers
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BookOpen className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Access Health Education</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn about health topics in your preferred language
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Manage Payments</h4>
                  <p className="text-sm text-muted-foreground">
                    View payment history and make payments securely
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

