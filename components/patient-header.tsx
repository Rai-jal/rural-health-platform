"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface PatientHeaderProps {
  title: string;
  description?: string;
}

export function PatientHeader({ title, description }: PatientHeaderProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("patientSidebarCollapsed");
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }

    // Listen for changes from other components
    const handleStorageChange = () => {
      const saved = localStorage.getItem("patientSidebarCollapsed");
      if (saved !== null) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-tab updates
    window.addEventListener("patientSidebarToggle", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("patientSidebarToggle", handleStorageChange);
    };
  }, []);

  const handleToggle = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("patientSidebarCollapsed", JSON.stringify(newState));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("patientSidebarToggle"));
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Desktop Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="hidden lg:flex"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}

