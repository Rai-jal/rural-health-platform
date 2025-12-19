"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  User,
  BarChart3,
  Phone,
  BookOpen,
  CreditCard,
  Users,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "Consultations",
    href: "/consultation",
    icon: Phone,
  },
  {
    name: "Health Education",
    href: "/education",
    icon: BookOpen,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
  {
    name: "Community",
    href: "/community",
    icon: Users,
  },
  {
    name: "Profile Settings",
    href: "/dashboard/profile",
    icon: Settings,
  },
];

interface PatientSidebarProps {
  isOpen: boolean; // For mobile
  isCollapsed: boolean; // For desktop
  onToggle: () => void; // For mobile
  onCollapseToggle: () => void; // For desktop
}

export function PatientSidebar({
  isOpen,
  isCollapsed,
  onToggle,
  onCollapseToggle,
}: PatientSidebarProps) {
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
          "fixed lg:static inset-y-0 left-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo/Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-sidebar-primary" />
              <span className="text-lg font-bold">Patient Portal</span>
            </div>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <User className="h-6 w-6 text-sidebar-primary" />
            </div>
          )}
          <div className="flex items-center space-x-1">
            {/* Desktop Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapseToggle}
              className="hidden lg:flex text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent p-1 h-8 w-8"
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
              className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
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
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
        <div className="border-t border-sidebar-border p-4">
          {!isCollapsed && (
            <div className="mb-3 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.full_name || "Patient"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mb-3 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <User className="h-5 w-5" />
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              "w-full border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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

