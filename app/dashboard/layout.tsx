"use client";

import { useState, useEffect } from "react";
import { PatientSidebar } from "@/components/patient-sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile open/close
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapsed/expanded

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("patientSidebarCollapsed");
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem("patientSidebarCollapsed", JSON.stringify(sidebarCollapsed));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("patientSidebarToggle"));
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      <PatientSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {/* Mobile Toggle Button */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </main>
    </div>
  );
}

