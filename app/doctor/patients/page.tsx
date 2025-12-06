"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Eye,
  Loader2,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { DoctorHeader } from "@/components/doctor-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  age?: number;
  location?: string;
  consultation_count: number;
}

export default function DoctorPatientsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.role !== "Doctor")) {
      router.push("/unauthorized");
      return;
    }

    if (isLoggedIn && user?.role === "Doctor") {
      fetchPatients();
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/doctor/patients");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch patients");
      }
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
      addToast({
        type: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load patients",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DoctorHeader
        title="My Patients"
        description="View and manage your patient list"
      />

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Patients ({filteredPatients.length})</CardTitle>
          <CardDescription>
            Patients who have consulted with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Consultations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No patients found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.full_name}
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone_number || "—"}</TableCell>
                    <TableCell>{patient.location || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {patient.consultation_count} consultation
                        {patient.consultation_count !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(patient)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Patient Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient Profile</DialogTitle>
            <DialogDescription>
              View patient information and consultation history
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="font-medium">{selectedPatient.full_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p>{selectedPatient.email}</p>
                  </div>
                </div>
                {selectedPatient.phone_number && (
                  <div>
                    <Label>Phone Number</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p>{selectedPatient.phone_number}</p>
                    </div>
                  </div>
                )}
                {selectedPatient.age && (
                  <div>
                    <Label>Age</Label>
                    <p>{selectedPatient.age} years</p>
                  </div>
                )}
                {selectedPatient.location && (
                  <div className="md:col-span-2">
                    <Label>Location</Label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p>{selectedPatient.location}</p>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label>Total Consultations</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="font-semibold">
                      {selectedPatient.consultation_count} consultation
                      {selectedPatient.consultation_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

