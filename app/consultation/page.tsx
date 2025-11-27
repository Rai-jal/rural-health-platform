"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Video,
  MessageSquare,
  Clock,
  User,
  Heart,
  Volume2,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  getHealthcareProviders,
  createConsultation,
  createPayment,
  type HealthcareProvider,
} from "@/lib/api/client";

export default function ConsultationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [selectedType, setSelectedType] = useState<
    "video" | "voice" | "sms" | null
  >(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<HealthcareProvider[]>([]);
  const [formData, setFormData] = useState({
    symptoms: "",
    language: "English",
  });

  const consultationTypes = [
    {
      id: "video",
      name: "Video Call",
      icon: Video,
      description: "Face-to-face consultation via smartphone",
      price: 15000,
      requirements: "Smartphone with internet",
    },
    {
      id: "voice",
      name: "Voice Call",
      icon: Phone,
      description: "Audio consultation via any phone",
      price: 10000,
      requirements: "Any phone (feature phone OK)",
    },
    {
      id: "sms",
      name: "SMS Consultation",
      icon: MessageSquare,
      description: "Text-based consultation",
      price: 5000,
      requirements: "Any phone with SMS",
    },
  ];

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login?redirect=/consultation");
      return;
    }

    // Load doctors if authenticated
    if (isLoggedIn) {
      loadDoctors();
    }
  }, [authLoading, isLoggedIn, router]);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const { data, error: apiError } = await getHealthcareProviders({
        available: true,
      });
      if (apiError) {
        setError(apiError);
        return;
      }
      setDoctors(data || []);
    } catch (error) {
      console.error("Error loading doctors:", error);
      setError("Failed to load healthcare providers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user || !isLoggedIn) {
      router.push("/auth/login?redirect=/consultation");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create consultation
      const selectedProvider = doctors.find((d) => d.id === selectedDoctor);
      const consultationType = consultationTypes.find(
        (t) => t.id === selectedType
      );

      if (!selectedProvider || !consultationType) {
        throw new Error("Invalid selection");
      }

      // Calculate next available time (simplified - in real app, check provider's schedule)
      const scheduledAt = new Date();
      scheduledAt.setHours(scheduledAt.getHours() + 2); // 2 hours from now

      // Create consultation via API
      const { data: consultation, error: consultationError } =
        await createConsultation({
          provider_id: selectedProvider.id,
          consultation_type: selectedType!,
          scheduled_at: scheduledAt.toISOString(),
          cost_leone: consultationType.price,
          reason_for_consultation: formData.symptoms || undefined,
        });

      if (consultationError || !consultation) {
        throw new Error(consultationError || "Failed to create consultation");
      }

      // Create payment record via API
      const { error: paymentError } = await createPayment({
        consultation_id: consultation.id,
        amount_leone: consultationType.price,
        payment_method: "mobile_money", // Default for demo
        payment_provider: "orange_money",
      });

      if (paymentError) {
        console.error("Payment creation error:", paymentError);
        // Don't fail the booking if payment creation fails - it can be retried
      }

      setIsBooked(true);
    } catch (error) {
      console.error("Error booking consultation:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error booking consultation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (authLoading || (isLoading && bookingStep === 1)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>
            {authLoading
              ? "Checking authentication..."
              : "Loading healthcare providers..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && bookingStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={loadDoctors}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isBooked) {
    const selectedProvider = doctors.find((d) => d.id === selectedDoctor);
    const consultationType = consultationTypes.find(
      (t) => t.id === selectedType
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Consultation Booked!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your consultation has been successfully scheduled. You will
              receive confirmation via SMS.
            </p>

            <Card className="text-left mb-8">
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Doctor:</span>
                  <span>{selectedProvider?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type:</span>
                  <span className="capitalize">
                    {selectedType} Consultation
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date & Time:</span>
                  <span>In 2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cost:</span>
                  <span>Le {consultationType?.price.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                <strong>What&apos;s Next:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
                <li>• You&apos;ll receive an SMS confirmation shortly</li>
                <li>• Payment instructions will be sent via SMS</li>
                <li>
                  • A reminder will be sent 1 hour before your appointment
                </li>
                <li>
                  • For voice/video calls, the doctor will call you at the
                  scheduled time
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
              <Link href="/education">
                <Button>Browse Health Education</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Book a Consultation
            </h1>
            <p className="text-gray-600">
              Connect with healthcare providers from anywhere
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                bookingStep >= 1 ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
            >
              1
            </div>
            <div
              className={`h-1 w-16 ${
                bookingStep >= 2 ? "bg-green-600" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                bookingStep >= 2 ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
            >
              2
            </div>
            <div
              className={`h-1 w-16 ${
                bookingStep >= 3 ? "bg-green-600" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                bookingStep >= 3 ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step 1: Choose Consultation Type */}
        {bookingStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">
              Choose Your Consultation Type
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {consultationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedType === type.id
                        ? "ring-2 ring-green-600 bg-green-50"
                        : ""
                    }`}
                    onClick={() => setSelectedType(type.id as any)}
                  >
                    <CardHeader className="text-center">
                      <Icon className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <CardTitle>{type.name}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-green-600">
                          Le {type.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {type.requirements}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Voice Navigation Helper */}
            <Card className="bg-blue-50 border-blue-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Volume2 className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Voice Navigation Available
                    </p>
                    <p className="text-sm text-blue-700">
                      Call *123*1# to book consultations using voice commands in
                      your local language
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                onClick={() => setBookingStep(2)}
                disabled={!selectedType}
                size="lg"
              >
                Continue to Select Doctor
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Doctor */}
        {bookingStep === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">
              Choose Your Healthcare Provider
            </h2>
            <div className="space-y-4 mb-8">
              {doctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedDoctor === doctor.id
                      ? "ring-2 ring-green-600 bg-green-50"
                      : ""
                  }`}
                  onClick={() => setSelectedDoctor(doctor.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold">
                              {doctor.full_name}
                            </h3>
                            <p className="text-gray-600">{doctor.specialty}</p>
                            <p className="text-sm text-gray-500">
                              {doctor.experience_years} years experience
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-2">
                              <Heart className="h-4 w-4 text-red-500 fill-current" />
                              <span className="font-semibold">
                                {doctor.rating}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Available
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">
                            Languages:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {doctor.languages.map((lang) => (
                              <Badge
                                key={lang}
                                variant="secondary"
                                className="text-xs"
                              >
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => setBookingStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setBookingStep(3)}
                disabled={!selectedDoctor}
                size="lg"
              >
                Continue to Booking Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Booking Details */}
        {bookingStep === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">
              Complete Your Booking
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Consultation Type:</span>
                    <span className="capitalize">{selectedType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Doctor:</span>
                    <span>
                      {doctors.find((d) => d.id === selectedDoctor)?.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Specialty:</span>
                    <span>
                      {doctors.find((d) => d.id === selectedDoctor)?.specialty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Next Available:</span>
                    <span>In 2 hours</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Cost:</span>
                    <span className="text-green-600">
                      Le{" "}
                      {consultationTypes
                        .find((t) => t.id === selectedType)
                        ?.price.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                  {user && (
                    <CardDescription>
                      Logged in as: {user.full_name || user.email}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="symptoms">Reason for Consultation</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Briefly describe your health concern or reason for consultation"
                      rows={4}
                      value={formData.symptoms}
                      onChange={(e) =>
                        setFormData({ ...formData, symptoms: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Preferred Language</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                    >
                      <option>English</option>
                      <option>Krio</option>
                      <option>Mende</option>
                      <option>Temne</option>
                      <option>Limba</option>
                    </select>
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => setBookingStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleBooking}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading || !user}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                You will receive SMS confirmation and payment instructions after
                booking
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
