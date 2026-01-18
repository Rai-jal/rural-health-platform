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
  Calendar,
  Search,
  Filter,
  Edit,
  Eye,
  Loader2,
  Save,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { AdminHeader } from "@/components/admin-header";
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
import { Textarea } from "@/components/ui/textarea";

interface Consultation {
  id: string;
  consultation_type: string;
  consultation_category?: string;
  status: string;
  scheduled_at: string | null;
  preferred_date?: string;
  preferred_time_range?: string;
  duration_minutes: number;
  cost_leone: number;
  reason_for_consultation?: string;
  notes?: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
  };
  healthcare_providers?: {
    id: string;
    full_name: string;
    specialty: string;
  };
}

interface HealthcareProvider {
  id: string;
  full_name: string;
  specialty: string;
  languages: string[];
  is_available: boolean;
  rating: number;
}

export default function ConsultationsPage() {
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
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    notes: "",
  });
  const [assignData, setAssignData] = useState({
    provider_id: "",
    scheduled_at: "",
  });

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.role !== "Admin")) {
      router.push("/unauthorized");
      return;
    }

    if (isLoggedIn && user?.role === "Admin") {
      fetchConsultations();
    }
  }, [authLoading, isLoggedIn, user, router, statusFilter]);

  const fetchConsultations = async () => {
    try {
      setIsLoading(true);
      const url =
        statusFilter !== "all"
          ? `/api/admin/consultations?status=${statusFilter}`
          : "/api/admin/consultations";
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

  const handleSaveEdit = async () => {
    if (!selectedConsultation) return;

    try {
      const response = await fetch(
        `/api/admin/consultations/${selectedConsultation.id}`,
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

  const formatDate = (dateString: string) => {
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
      draft: "outline",
      pending_admin_review: "outline",
      assigned: "secondary",
      confirmed: "default",
      scheduled: "default",
      in_progress: "secondary",
      completed: "default",
      cancelled: "outline",
    };
    return variants[status] || "outline";
  };

  const handleAssign = async (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setAssignData({
      provider_id: "",
      scheduled_at: consultation.preferred_date || "",
    });
    setIsAssignDialogOpen(true);
    fetchProvidersForAssignment(consultation);
  };

  const fetchProvidersForAssignment = async (consultation: Consultation) => {
    try {
      setIsLoadingProviders(true);
      const response = await fetch("/api/healthcare-providers?available=true");
      if (!response.ok) {
        throw new Error("Failed to fetch providers");
      }
      const data = await response.json();
      setProviders(data.data || []);
    } catch (err) {
      console.error("Error fetching providers:", err);
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load providers",
      });
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const handleSaveAssign = async () => {
    if (!selectedConsultation || !assignData.provider_id) {
      addToast({
        type: "error",
        title: "Error",
        description: "Please select a provider",
      });
      return;
    }

    try {
      // Convert datetime-local format to ISO datetime string if provided
      let scheduledAt: string | undefined = undefined;
      if (assignData.scheduled_at && assignData.scheduled_at.trim() !== "") {
        // datetime-local format is "YYYY-MM-DDTHH:mm", convert to ISO format
        const date = new Date(assignData.scheduled_at);
        if (!isNaN(date.getTime())) {
          scheduledAt = date.toISOString();
        }
      }

      const response = await fetch(
        `/api/admin/consultations/${selectedConsultation.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider_id: assignData.provider_id,
            scheduled_at: scheduledAt,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        // Show validation errors more clearly
        if (error.issues && Array.isArray(error.issues)) {
          const errorMessages = error.issues.map((issue: any) => 
            `${issue.path.join('.')}: ${issue.message}`
          ).join(', ');
          throw new Error(`Validation error: ${errorMessages}`);
        }
        throw new Error(error.error || "Failed to assign provider");
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Provider assigned successfully",
      });

      setIsAssignDialogOpen(false);
      fetchConsultations();
    } catch (err) {
      console.error("Error assigning provider:", err);
      addToast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to assign provider",
      });
    }
  };

  const filteredConsultations = consultations.filter((c) => {
    const matchesSearch =
      c.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.healthcare_providers?.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
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
      <AdminHeader
        title="Consultation Management"
        description="Monitor and manage all consultations across the platform"
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient, provider, or type..."
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
                <option value="pending_admin_review">Pending Review</option>
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
          <CardTitle>All Consultations ({filteredConsultations.length})</CardTitle>
          <CardDescription>
            View and manage consultation requests and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Provider</TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8">
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
                      {consultation.healthcare_providers?.full_name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {consultation.consultation_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {consultation.scheduled_at
                        ? formatDate(consultation.scheduled_at)
                        : consultation.preferred_date
                        ? `Preferred: ${new Date(consultation.preferred_date).toLocaleDateString()}`
                        : "Not scheduled"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(consultation.status)}>
                        {consultation.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(consultation.cost_leone)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(consultation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {consultation.status === "pending_admin_review" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAssign(consultation)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        )}
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
                </div>
                <div>
                  <Label>Provider</Label>
                  <p className="font-medium">
                    {selectedConsultation.healthcare_providers?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedConsultation.healthcare_providers?.specialty}
                  </p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="capitalize">
                    {selectedConsultation.consultation_type}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusBadge(selectedConsultation.status)}>
                    {selectedConsultation.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label>Scheduled At</Label>
                  <p>
                    {selectedConsultation.scheduled_at
                      ? formatDate(selectedConsultation.scheduled_at)
                      : selectedConsultation.preferred_date
                      ? `Preferred: ${new Date(selectedConsultation.preferred_date).toLocaleDateString()}`
                      : "Not scheduled"}
                  </p>
                  {selectedConsultation.preferred_time_range && (
                    <p className="text-sm text-gray-500">
                      Preferred time: {selectedConsultation.preferred_time_range}
                    </p>
                  )}
                </div>
                {selectedConsultation.consultation_category && (
                  <div>
                    <Label>Category</Label>
                    <p className="capitalize">
                      {selectedConsultation.consultation_category.replace("_", " ")}
                    </p>
                  </div>
                )}
                <div>
                  <Label>Amount</Label>
                  <p className="font-semibold">
                    {formatCurrency(selectedConsultation.cost_leone)}
                  </p>
                </div>
                {selectedConsultation.reason_for_consultation && (
                  <div className="md:col-span-2">
                    <Label>Reason</Label>
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
            <DialogTitle>Edit Consultation</DialogTitle>
            <DialogDescription>
              Update consultation status and notes
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
                <option value="pending_admin_review">Pending Review</option>
                <option value="assigned">Assigned</option>
                <option value="confirmed">Confirmed</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={editData.notes}
                onChange={(e) =>
                  setEditData({ ...editData, notes: e.target.value })
                }
                rows={4}
                placeholder="Add administrative notes..."
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

      {/* Assign Provider Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Healthcare Provider</DialogTitle>
            <DialogDescription>
              Select a provider for this consultation request
            </DialogDescription>
          </DialogHeader>
          {selectedConsultation && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium mb-2">Request Details:</p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Patient:</span>{" "}
                    {selectedConsultation.users?.full_name}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span>{" "}
                    {selectedConsultation.consultation_type}
                  </p>
                  {selectedConsultation.consultation_category && (
                    <p>
                      <span className="font-medium">Category:</span>{" "}
                      {selectedConsultation.consultation_category.replace("_", " ")}
                    </p>
                  )}
                  {selectedConsultation.preferred_date && (
                    <p>
                      <span className="font-medium">Preferred Date:</span>{" "}
                      {new Date(selectedConsultation.preferred_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="provider">Select Provider *</Label>
                {isLoadingProviders ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading providers...
                  </div>
                ) : (
                  <select
                    id="provider"
                    value={assignData.provider_id}
                    onChange={(e) =>
                      setAssignData({ ...assignData, provider_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select a provider...</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.full_name} - {provider.specialty}
                        {provider.is_available ? " (Available)" : " (Unavailable)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label htmlFor="scheduled_at">Scheduled Date & Time (Optional)</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={assignData.scheduled_at}
                  onChange={(e) =>
                    setAssignData({ ...assignData, scheduled_at: e.target.value })
                  }
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use patient's preferred date
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAssign} disabled={!assignData.provider_id}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

