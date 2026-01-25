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
import {
  Phone,
  Video,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Heart,
  Baby,
  Utensils,
  Users,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createConsultationRequest } from "@/lib/api/client";

export default function ConsultationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Patient Information
    patient_name: "",
    patient_phone: "",
    patient_address: "",
    // Consultation Details
    consultation_category: "",
    consultation_type: "" as "video" | "voice" | "sms" | "",
    preferred_date: "",
    preferred_time_range: "",
    reason_for_consultation: "",
    consent_acknowledged: false,
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

  const consultationCategories = [
    {
      id: "maternal_health",
      name: "Maternal Health",
      icon: Heart,
      description: "Pregnancy and postnatal care",
    },
    {
      id: "reproductive_health",
      name: "Reproductive Health",
      icon: Users,
      description: "Family planning and reproductive care",
    },
    {
      id: "general_inquiry",
      name: "General Inquiry",
      icon: HelpCircle,
      description: "General health questions",
    },
    {
      id: "childcare",
      name: "Child Care",
      icon: Baby,
      description: "Children's health and development",
    },
    {
      id: "nutrition",
      name: "Nutrition",
      icon: Utensils,
      description: "Diet and nutrition advice",
    },
    {
      id: "other",
      name: "Other",
      icon: HelpCircle,
      description: "Other health concerns",
    },
  ];

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login?redirect=/consultation");
      return;
    }

    // Auto-fill patient information from user profile
    if (user && isLoggedIn) {
      setFormData((prev) => ({
        ...prev,
        patient_name: user.full_name || "",
        patient_phone: user.phone_number || "",
        patient_address: user.location || "",
      }));
    }
  }, [authLoading, isLoggedIn, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isLoggedIn) {
      router.push("/auth/login?redirect=/consultation");
      return;
    }

    // Validate form
    if (!formData.patient_name?.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formData.patient_phone?.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (!formData.consultation_category) {
      setError("Please select a consultation category");
      return;
    }

    if (!formData.consultation_type) {
      setError("Please select a consultation type");
      return;
    }

    if (!formData.preferred_date) {
      setError("Please select a preferred date");
      return;
    }

    if (!formData.consent_acknowledged) {
      setError("You must acknowledge consent to continue");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: apiError } = await createConsultationRequest({
        consultation_category: formData.consultation_category as any,
        consultation_type: formData.consultation_type as "video" | "voice" | "sms",
        preferred_date: formData.preferred_date,
        preferred_time_range: formData.preferred_time_range || undefined,
        reason_for_consultation: formData.reason_for_consultation || undefined,
        consent_acknowledged: formData.consent_acknowledged,
        // ✅ FIX: Send phone number and name to save to user profile
        patient_phone: formData.patient_phone,
        patient_name: formData.patient_name,
      });

      if (apiError || !data) {
        // Log the full error for debugging
        console.error("API Error:", apiError);
        throw new Error(apiError || "Failed to submit consultation request");
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error("Error submitting request:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error submitting consultation request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>
            {authLoading
              ? "Checking authentication..."
              : "Submitting your request..."}
          </p>
        </div>
      </div>
    );
  }

  // Show success state
  if (isSubmitted) {
    const selectedCategory = consultationCategories.find(
      (c) => c.id === formData.consultation_category
    );
    const selectedType = consultationTypes.find(
      (t) => t.id === formData.consultation_type
    );

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Request Submitted!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your consultation request has been submitted and is being reviewed by our team.
            </p>

            <Card className="text-left mb-8">
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pb-4 border-b">
                  <h3 className="font-semibold mb-3">Your Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span>{formData.patient_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>{formData.patient_phone}</span>
                    </div>
                    {formData.patient_address && (
                      <div className="flex justify-between">
                        <span className="font-medium">Address:</span>
                        <span>{formData.patient_address}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Category:</span>
                    <span>{selectedCategory?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="capitalize">
                      {selectedType?.name} Consultation
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Preferred Date:</span>
                    <span>{new Date(formData.preferred_date).toLocaleDateString()}</span>
                  </div>
                  {formData.preferred_time_range && (
                    <div className="flex justify-between">
                      <span className="font-medium">Preferred Time:</span>
                      <span>{formData.preferred_time_range}</span>
                    </div>
                  )}
                  {formData.reason_for_consultation && (
                    <div className="pt-2 border-t">
                      <span className="font-medium block mb-2">Reason:</span>
                      <p className="text-sm text-muted-foreground">
                        {formData.reason_for_consultation}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <p className="text-sm text-foreground">
                <strong>What&apos;s Next:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                <li>• Our admin team will review your request</li>
                <li>• You will be assigned to an appropriate healthcare provider</li>
                <li>• You&apos;ll receive a notification when a provider is assigned</li>
                <li>• You can then confirm the assignment or choose another provider</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <Link href="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
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
    <div className="min-h-screen bg-background p-4">
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
            <h1 className="text-3xl font-bold text-foreground">
              Request a Consultation
            </h1>
            <p className="text-muted-foreground">
              Submit your request and our team will match you with the right healthcare provider
            </p>
          </div>
        </div>

        {/* Consultation Request Form */}
        <form onSubmit={handleSubmit}>
          {/* Patient Information Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Your Information</CardTitle>
              <CardDescription>
                Please verify or update your contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_name">Full Name *</Label>
                  <Input
                    id="patient_name"
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) =>
                      setFormData({ ...formData, patient_name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patient_phone">Phone Number *</Label>
                  <Input
                    id="patient_phone"
                    type="tel"
                    value={formData.patient_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, patient_phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="patient_address">Address/Location</Label>
                <Input
                  id="patient_address"
                  type="text"
                  value={formData.patient_address}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_address: e.target.value })
                  }
                  placeholder="Enter your address or location (optional)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This helps us match you with nearby providers if applicable
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>2. Consultation Category</CardTitle>
              <CardDescription>
                What type of health concern do you have?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {consultationCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        formData.consultation_category === category.id
                          ? "ring-2 ring-primary bg-primary/10"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          consultation_category: category.id,
                        })
                      }
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <h3 className="font-semibold mb-1">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. Consultation Type</CardTitle>
              <CardDescription>
                How would you like to consult with the provider?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {consultationTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        formData.consultation_type === type.id
                          ? "ring-2 ring-green-600 bg-green-50"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          consultation_type: type.id as "video" | "voice" | "sms",
                        })
                      }
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
                          <p className="text-sm text-muted-foreground">
                            {type.requirements}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>4. Preferred Date & Time</CardTitle>
              <CardDescription>
                When would you prefer to have your consultation?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preferred_date">Preferred Date *</Label>
                <Input
                  id="preferred_date"
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) =>
                    setFormData({ ...formData, preferred_date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="preferred_time_range">
                  Preferred Time Range (Optional)
                </Label>
                <Input
                  id="preferred_time_range"
                  type="text"
                  placeholder="e.g., Morning (8am-12pm), Afternoon (12pm-5pm), Evening (5pm-8pm)"
                  value={formData.preferred_time_range}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_time_range: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>5. Health Concern (Optional)</CardTitle>
              <CardDescription>
                Briefly describe your health concern or reason for consultation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your health concern or reason for consultation..."
                rows={4}
                value={formData.reason_for_consultation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reason_for_consultation: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>6. Consent & Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consent_acknowledged}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consent_acknowledged: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4"
                  required
                />
                <Label htmlFor="consent" className="text-sm">
                  I acknowledge that I understand and consent to the collection and use of my health information for the purpose of this consultation. I understand my data will be kept confidential and used only for providing healthcare services.
                </Label>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center gap-4">
            <Link href="/">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
