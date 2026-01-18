"use client";

import { useState } from "react";
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
  Phone,
  Heart,
  BookOpen,
  Wifi,
  WifiOff,
  Volume2,
  MessageSquare,
  CreditCard,
  Users,
  Calendar,
  Globe,
  Smartphone,
  Radio,
  Stethoscope,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useLanguage, type Language } from "@/lib/language-context";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [isOnline, setIsOnline] = useState(true);
  const { currentLanguage, setCurrentLanguage, t } = useLanguage();
  const { user, isLoading, isLoggedIn } = useAuth();

  const languages: Language[] = ["English", "Krio", "Mende", "Temne", "Limba"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {t("hero.title")}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/consultation">
              <Button size="lg">
                <Phone className="h-5 w-5 mr-2" />
                {t("hero.book_consultation")}
              </Button>
            </Link>
            <Link href="/education">
              <Button size="lg" variant="outline">
                <BookOpen className="h-5 w-5 mr-2" />
                {t("hero.health_education")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Access Methods */}
      <section className="py-12 px-4 bg-card">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8">
            {t("access.title")}
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>{t("access.smartphone")}</CardTitle>
                <CardDescription>{t("access.smartphone_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Video consultations</li>
                  <li>• Interactive health content</li>
                  <li>• Appointment scheduling</li>
                  <li>• Medical records</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Phone className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>{t("access.ussd")}</CardTitle>
                <CardDescription>{t("access.ussd_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Dial *123# for menu</li>
                  <li>• SMS consultations</li>
                  <li>• Health tips via SMS</li>
                  <li>• Appointment reminders</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Radio className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>{t("access.voice")}</CardTitle>
                <CardDescription>{t("access.voice_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Voice-guided navigation</li>
                  <li>• Audio health education</li>
                  <li>• Speak with healthcare providers</li>
                  <li>• Local language support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8">
            {t("features.title")}
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/consultation">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Phone className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">
                    {t("features.consultations")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("features.consultations_desc")}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/education">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <BookOpen className="h-10 w-10 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">
                    {t("features.education")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("features.education_desc")}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/payments">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <CreditCard className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">
                    {t("features.payments")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("features.payments_desc")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Offline Capabilities */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-4">{t("offline.title")}</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("offline.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-6 w-6 mr-2 text-green-600" />
                  {t("offline.health_content")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Pre-downloaded health education materials</li>
                  <li>• Audio content in local languages</li>
                  <li>• Emergency health information</li>
                  <li>• Pregnancy and childcare guides</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
                  {t("offline.sms_voice")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• SMS-based consultation booking</li>
                  <li>• Voice call consultations</li>
                  <li>• Health reminders via SMS</li>
                  <li>• Emergency contact system</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-8">{t("actions.title")}</h3>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 rounded-lg p-6">
              <Calendar className="h-10 w-10 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">
                {t("actions.book")}
              </h4>
              <p className="text-green-100 mb-4">{t("actions.book_desc")}</p>
              <Link href="/consultation">
                <Button variant="secondary" className="w-full">
                  {t("actions.book_now")}
                </Button>
              </Link>
            </div>

            <div className="bg-white/10 rounded-lg p-6">
              <Volume2 className="h-10 w-10 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">
                {t("actions.learn")}
              </h4>
              <p className="text-green-100 mb-4">{t("actions.learn_desc")}</p>
              <Link href="/education">
                <Button variant="secondary" className="w-full">
                  {t("actions.start_learning")}
                </Button>
              </Link>
            </div>

            <div className="bg-white/10 rounded-lg p-6">
              <Phone className="h-10 w-10 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">
                {t("actions.call")}
              </h4>
              <p className="text-green-100 mb-4">{t("actions.call_desc")}</p>
              <Button variant="secondary" className="w-full">
                *123#
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">{t("header.title")}</span>
              </div>
              <p className="text-muted-foreground text-sm">{t("footer.tagline")}</p>
            </div>

            <div>
              <h5 className="font-semibold mb-4 text-foreground">{t("footer.services")}</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/consultation" className="hover:text-foreground transition-colors">
                    {t("features.consultations")}
                  </Link>
                </li>
                <li>
                  <Link href="/education" className="hover:text-foreground transition-colors">
                    {t("features.education")}
                  </Link>
                </li>
                <li>
                  <Link href="/payments" className="hover:text-foreground transition-colors">
                    {t("features.payments")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4 text-foreground">
                {t("footer.access_methods")}
              </h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Smartphone App</li>
                <li>USSD: *123#</li>
                <li>SMS: Text HEALTH to 1234</li>
                <li>Voice: Call 1-800-HEALTH</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4 text-foreground">{t("footer.emergency")}</h5>
              <div className="space-y-2 text-sm">
                <p className="text-destructive font-semibold">
                  {t("footer.emergency_line")}
                </p>
                <p className="text-foreground">Call: 117</p>
                <p className="text-foreground">SMS: EMERGENCY to 1234</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 HealthConnect. {t("footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
