"use client";

import { useState, useEffect } from "react";
import { DoctorSidebar } from "@/components/doctor-sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile open/close
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapsed/expanded

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("doctorSidebarCollapsed");
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem("doctorSidebarCollapsed", JSON.stringify(sidebarCollapsed));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("doctorSidebarToggle"));
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      <DoctorSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Mobile Toggle Button */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </main>
    </div>
  );
}

