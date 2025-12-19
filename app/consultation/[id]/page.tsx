"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Video,
  MessageSquare,
  MapPin,
  Mail,
  Loader2,
  FileText,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";

interface Consultation {
  id: string;
  consultation_type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  cost_leone: number;
  reason_for_consultation?: string;
  notes?: string;
  created_at: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    location?: string;
  };
  healthcare_providers?: {
    id: string;
    full_name: string;
    specialty: string;
    languages: string[];
    experience_years: number;
    rating: number;
    location?: string;
  };
}

export default function ConsultationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params?.id as string;
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    if (consultationId && isLoggedIn) {
      fetchConsultation();
    }
  }, [authLoading, isLoggedIn, consultationId, router]);

  const fetchConsultation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/consultations/${consultationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Consultation not found");
        }
        throw new Error("Failed to fetch consultation");
      }
      const data = await response.json();
      setConsultation(data.consultation);
    } catch (err: any) {
      console.error("Error fetching consultation:", err);
      setError(err.message || "Failed to load consultation");
      addToast({
        type: "error",
        title: "Error",
        description: err.message || "Failed to load consultation details",
      });
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConsultationTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "video":
        return Video;
      case "voice":
        return Phone;
      case "sms":
        return MessageSquare;
      default:
        return Phone;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "scheduled":
        return "secondary";
      case "in_progress":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading consultation details...</p>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || "Consultation not found"}</p>
            <div className="flex gap-2">
              <Button onClick={fetchConsultation}>Retry</Button>
              <Link href="/consultation">
                <Button variant="outline">Back to Consultations</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ConsultationTypeIcon = getConsultationTypeIcon(consultation.consultation_type);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/consultation">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Consultation Details
            </h1>
            <p className="text-gray-600">View full consultation information</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Consultation Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ConsultationTypeIcon className="h-6 w-6 text-green-600" />
                    <div>
                      <CardTitle className="capitalize">
                        {consultation.consultation_type} Consultation
                      </CardTitle>
                      <CardDescription>
                        Consultation ID: {consultation.id.slice(0, 8)}...
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(consultation.status)}>
                    {consultation.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Scheduled Date</p>
                      <p className="font-medium">
                        {formatDate(consultation.scheduled_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">
                        {consultation.duration_minutes} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Cost</p>
                      <p className="font-medium">
                        {formatCurrency(consultation.cost_leone)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium capitalize">
                        {consultation.consultation_type}
                      </p>
                    </div>
                  </div>
                </div>

                {consultation.reason_for_consultation && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">
                      Reason for Consultation
                    </p>
                    <p className="text-gray-700">
                      {consultation.reason_for_consultation}
                    </p>
                  </div>
                )}

                {consultation.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Doctor Notes</p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {consultation.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Healthcare Provider Info */}
            {consultation.healthcare_providers && (
              <Card>
                <CardHeader>
                  <CardTitle>Healthcare Provider</CardTitle>
                  <CardDescription>Your assigned healthcare provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {consultation.healthcare_providers.full_name}
                      </h3>
                      <p className="text-gray-600">
                        {consultation.healthcare_providers.specialty}
                      </p>
                      {consultation.healthcare_providers.experience_years > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {consultation.healthcare_providers.experience_years} years of experience
                        </p>
                      )}
                      {consultation.healthcare_providers.rating > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-sm font-medium">
                            Rating: {consultation.healthcare_providers.rating.toFixed(1)}/5.0
                          </span>
                        </div>
                      )}
                      {consultation.healthcare_providers.languages &&
                        consultation.healthcare_providers.languages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {consultation.healthcare_providers.languages.map((lang) => (
                              <Badge key={lang} variant="outline">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        )}
                      {consultation.healthcare_providers.location && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{consultation.healthcare_providers.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Info (if viewing as doctor/admin) */}
            {consultation.users && user?.role !== "Patient" && (
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{consultation.users.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">{consultation.users.email}</p>
                    </div>
                  </div>
                  {consultation.users.phone_number && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">{consultation.users.phone_number}</p>
                      </div>
                    </div>
                  )}
                  {consultation.users.location && (
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">{consultation.users.location}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user?.role === "Patient" && consultation.status === "scheduled" && (
                  <Button className="w-full" variant="outline">
                    Reschedule Consultation
                  </Button>
                )}
                {user?.role === "Patient" && (
                  <Link href="/payments" className="block">
                    <Button className="w-full" variant="outline">
                      View Payment
                    </Button>
                  </Link>
                )}
                <Link href="/consultation" className="block">
                  <Button className="w-full" variant="outline">
                    Back to Consultations
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Consultation Info */}
            <Card>
              <CardHeader>
                <CardTitle>Consultation Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(consultation.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={getStatusColor(consultation.status)}>
                    {consultation.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

