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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Search,
  Filter,
  Edit,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Save,
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

interface Consultation {
  id: string;
  consultation_type: string;
  status: string;
  scheduled_at: string | null;
  preferred_date?: string | null;
  duration_minutes: number;
  cost_leone: number;
  reason_for_consultation?: string;
  notes?: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    age?: number;
    location?: string;
  };
}

export default function DoctorConsultationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.role !== "Doctor")) {
      router.push("/unauthorized");
      return;
    }

    if (isLoggedIn && user?.role === "Doctor") {
      fetchConsultations();
    }
  }, [authLoading, isLoggedIn, user, router, statusFilter]);

  const fetchConsultations = async () => {
    try {
      setIsLoading(true);
      const url =
        statusFilter !== "all"
          ? `/api/doctor/consultations?status=${statusFilter}`
          : "/api/doctor/consultations";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch consultations");
      }
      const data = await response.json();
      setConsultations(data.consultations || []);
    } catch (err) {
      console.error("Error fetching consultations:", err);
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load consultations",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setEditData({
      status: consultation.status,
      notes: consultation.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleAccept = async (consultationId: string) => {
    try {
      const response = await fetch(`/api/doctor/consultations/${consultationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "scheduled" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept consultation");
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Consultation accepted",
      });

      fetchConsultations();
    } catch (err) {
      console.error("Error accepting consultation:", err);
      addToast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to accept consultation",
      });
    }
  };

  const handleDecline = async (consultationId: string) => {
    if (!confirm("Are you sure you want to decline this consultation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/doctor/consultations/${consultationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to decline consultation");
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Consultation declined",
      });

      fetchConsultations();
    } catch (err) {
      console.error("Error declining consultation:", err);
      addToast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to decline consultation",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedConsultation) return;

    try {
      const response = await fetch(
        `/api/doctor/consultations/${selectedConsultation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update consultation");
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Consultation updated successfully",
      });

      setIsEditDialogOpen(false);
      fetchConsultations();
    } catch (err) {
      console.error("Error updating consultation:", err);
      addToast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update consultation",
      });
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return "Not scheduled";
    }
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `Le ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      assigned: "outline",
      confirmed: "secondary",
      scheduled: "default",
      in_progress: "secondary",
      completed: "default",
      cancelled: "outline",
    };
    return variants[status] || "outline";
  };

  const filteredConsultations = consultations.filter((c) => {
    const matchesSearch =
      c.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.consultation_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DoctorHeader
        title="Consultation Management"
        description="Manage your patient consultations"
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="confirmed">Confirmed</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultations Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Consultations ({filteredConsultations.length})</CardTitle>
          <CardDescription>
            View and manage your patient consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConsultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No consultations found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredConsultations.map((consultation) => (
                  <TableRow key={consultation.id}>
                    <TableCell className="font-medium">
                      {consultation.users?.full_name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {consultation.consultation_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(consultation.scheduled_at)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(consultation.status)}>
                        {consultation.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(consultation.cost_leone)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {consultation.status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAccept(consultation.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecline(consultation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(consultation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(consultation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Consultation Details</DialogTitle>
            <DialogDescription>
              View complete consultation information
            </DialogDescription>
          </DialogHeader>
          {selectedConsultation && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Patient</Label>
                  <p className="font-medium">
                    {selectedConsultation.users?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedConsultation.users?.email}
                  </p>
                  {selectedConsultation.users?.phone_number && (
                    <p className="text-sm text-gray-500">
                      {selectedConsultation.users.phone_number}
                    </p>
                  )}
                  {selectedConsultation.users?.age && (
                    <p className="text-sm text-gray-500">
                      Age: {selectedConsultation.users.age}
                    </p>
                  )}
                  {selectedConsultation.users?.location && (
                    <p className="text-sm text-gray-500">
                      {selectedConsultation.users.location}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="capitalize">{selectedConsultation.consultation_type}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusBadge(selectedConsultation.status)}>
                    {selectedConsultation.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label>Scheduled At</Label>
                  <p>{formatDate(selectedConsultation.scheduled_at)}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-semibold">
                    {formatCurrency(selectedConsultation.cost_leone)}
                  </p>
                </div>
                {selectedConsultation.duration_minutes > 0 && (
                  <div>
                    <Label>Duration</Label>
                    <p>{selectedConsultation.duration_minutes} minutes</p>
                  </div>
                )}
                {selectedConsultation.reason_for_consultation && (
                  <div className="md:col-span-2">
                    <Label>Reason for Consultation</Label>
                    <p>{selectedConsultation.reason_for_consultation}</p>
                  </div>
                )}
                {selectedConsultation.notes && (
                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <p>{selectedConsultation.notes}</p>
                  </div>
                )}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Consultation</DialogTitle>
            <DialogDescription>
              Update consultation status and add medical notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="assigned">Assigned</option>
                <option value="confirmed">Confirmed</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Medical Notes</Label>
              <Textarea
                id="notes"
                value={editData.notes}
                onChange={(e) =>
                  setEditData({ ...editData, notes: e.target.value })
                }
                rows={6}
                placeholder="Add consultation notes, observations, recommendations..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

