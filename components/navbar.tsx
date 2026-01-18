"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Menu,
  User,
  LogOut,
  Shield,
  Stethoscope,
  Phone,
  BookOpen,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, isLoggedIn, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Hide navbar on admin, doctor, and patient dashboard pages (they have their own sidebar)
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/doctor") ||
    pathname?.startsWith("/dashboard")
  ) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const getRoleIcon = () => {
    if (!user) return null;
    switch (user.role) {
      case "Admin":
        return <Shield className="h-4 w-4 text-destructive" />;
      case "Doctor":
        return <Stethoscope className="h-4 w-4 text-secondary" />;
      default:
        return <User className="h-4 w-4 text-primary" />;
    }
  };

  const getRoleName = () => {
    if (!user) return "";
    switch (user.role) {
      case "Admin":
        return "Administrator";
      case "Doctor":
        return "Healthcare Provider";
      default:
        return "Patient";
    }
  };

  return (
    <nav className="bg-card shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              HealthConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isLoggedIn && !isLoading && (
            <div className="hidden md:flex items-center space-x-6">
              {user?.role === "Admin" ? (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : user?.role === "Doctor" ? (
                <Link href="/doctor">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
              )}

              {user?.role === "Patient" && (
                <>
                  <Link href="/consultation">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Consultations
                    </Button>
                  </Link>
                  <Link href="/education">
                    <Button variant="ghost" size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Education
                    </Button>
                  </Link>
                </>
              )}

              {user?.role === "Doctor" && (
                <Link href="/doctor">
                  <Button variant="ghost" size="sm">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    My Dashboard
                  </Button>
                </Link>
              )}

              {user?.role === "Admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              <div className="flex items-center space-x-3 pl-4 border-l">
                <div className="flex items-center space-x-2">
                  {getRoleIcon()}
                  <div className="text-sm">
                    <p className="font-medium">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{getRoleName()}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isLoggedIn && !isLoading && (
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          {/* Sign In Button (if not logged in) */}
          {!isLoggedIn && !isLoading && (
            <Link href="/auth/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isLoggedIn && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {user?.role === "Admin" ? (
                <Link href="/admin">
                  <Button variant="ghost" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>
              ) : user?.role === "Doctor" ? (
                <Link href="/doctor">
                  <Button variant="ghost" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>
              )}

              {user?.role === "Patient" && (
                <>
                  <Link href="/consultation">
                    <Button variant="ghost" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      Consultations
                    </Button>
                  </Link>
                  <Link href="/education">
                    <Button variant="ghost" className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Education
                    </Button>
                  </Link>
                </>
              )}

              {user?.role === "Doctor" && (
                <Link href="/doctor">
                  <Button variant="ghost" className="w-full justify-start">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Doctor Dashboard
                  </Button>
                </Link>
              )}

              {user?.role === "Admin" && (
                <Link href="/admin">
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}

              <div className="pt-4 border-t">
                <div className="px-2 py-2 mb-2">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon()}
                    <div>
                      <p className="text-sm font-medium">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{getRoleName()}</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
