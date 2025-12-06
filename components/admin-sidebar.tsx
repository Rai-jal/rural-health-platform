"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

import {
  Shield,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Calendar,
  DollarSign,
  BookOpen,
} from "lucide-react";

const navigation = [
  {
    name: "Overview",
    href: "/admin",
    icon: BarChart3,
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Healthcare Providers",
    href: "/admin/providers",
    icon: Stethoscope,
  },
  {
    name: "Consultations",
    href: "/admin/consultations",
    icon: Calendar,
  },
  {
    name: "Health Content",
    href: "/admin/content",
    icon: BookOpen,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: DollarSign,
  },
  {
    name: "Profile Settings",
    href: "/admin/profile",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  isOpen: boolean; // For mobile
  isCollapsed: boolean; // For desktop
  onToggle: () => void; // For mobile
  onCollapseToggle: () => void; // For desktop
}

export function AdminSidebar({
  isOpen,
  isCollapsed,
  onToggle,
  onCollapseToggle,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex h-screen flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo/Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-green-500" />
              <span className="text-lg font-bold">Admin Panel</span>
            </div>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
          )}
          <div className="flex items-center space-x-1">
            {/* Desktop Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapseToggle}
              className="hidden lg:flex text-gray-300 hover:text-white hover:bg-gray-800 p-1 h-8 w-8"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-green-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white",
                  isCollapsed ? "justify-center" : "space-x-3"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-800 p-4">
          {!isCollapsed && (
            <div className="mb-3 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 flex-shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.full_name || "Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mb-3 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              "w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white",
              isCollapsed ? "px-2" : ""
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  );
}
