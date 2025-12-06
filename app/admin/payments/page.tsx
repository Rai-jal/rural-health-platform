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
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
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

interface Payment {
  id: string;
  amount_leone: number;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  payment_provider?: string;
  created_at: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
  consultations?: {
    id: string;
    consultation_type: string;
    scheduled_at: string;
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.role !== "Admin")) {
      router.push("/unauthorized");
      return;
    }

    if (isLoggedIn && user?.role === "Admin") {
      fetchPayments();
    }
  }, [authLoading, isLoggedIn, user, router, statusFilter, methodFilter]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      let url = "/api/admin/payments?";
      if (statusFilter !== "all") {
        url += `status=${statusFilter}&`;
      }
      if (methodFilter !== "all") {
        url += `payment_method=${methodFilter}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load payments",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;

    if (
      !confirm(
        `Are you sure you want to refund Le ${selectedPayment.amount_leone.toLocaleString()}?`
      )
    ) {
      return;
    }

    setIsRefunding(true);
    try {
      const response = await fetch(
        `/api/admin/payments/${selectedPayment.id}/refund`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process refund");
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Refund processed successfully",
      });

      setIsViewDialogOpen(false);
      fetchPayments();
    } catch (err) {
      console.error("Error processing refund:", err);
      addToast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to process refund",
      });
    } finally {
      setIsRefunding(false);
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
      completed: "default",
      pending: "secondary",
      failed: "outline",
      refunded: "outline",
    };
    return variants[status] || "outline";
  };

  const totalRevenue = payments
    .filter((p) => p.payment_status === "completed")
    .reduce((sum, p) => sum + p.amount_leone, 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminHeader
        title="Payment Management"
        description="Monitor all payments and process refunds"
      />

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payments</CardDescription>
            <CardTitle className="text-2xl">{payments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Payments</CardDescription>
            <CardTitle className="text-2xl">
              {payments.filter((p) => p.payment_status === "completed").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user, email, or transaction ID..."
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Methods</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments ({filteredPayments.length})</CardTitle>
          <CardDescription>
            View payment transactions and process refunds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No payments found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.users?.full_name || "N/A"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount_leone)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.payment_method.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(payment.payment_status)}>
                        {payment.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.transaction_id || "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(payment.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(payment)}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View complete payment information
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <p className="font-medium">
                    {selectedPayment.users?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedPayment.users?.email}
                  </p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-semibold text-lg">
                    {formatCurrency(selectedPayment.amount_leone)}
                  </p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="capitalize">
                    {selectedPayment.payment_method.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusBadge(selectedPayment.payment_status)}>
                    {selectedPayment.payment_status}
                  </Badge>
                </div>
                {selectedPayment.transaction_id && (
                  <div>
                    <Label>Transaction ID</Label>
                    <p className="font-mono text-sm">
                      {selectedPayment.transaction_id}
                    </p>
                  </div>
                )}
                {selectedPayment.payment_provider && (
                  <div>
                    <Label>Payment Provider</Label>
                    <p>{selectedPayment.payment_provider}</p>
                  </div>
                )}
                <div>
                  <Label>Date</Label>
                  <p>{formatDate(selectedPayment.created_at)}</p>
                </div>
                {selectedPayment.consultations && (
                  <div>
                    <Label>Consultation</Label>
                    <p className="capitalize">
                      {selectedPayment.consultations.consultation_type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(selectedPayment.consultations.scheduled_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedPayment?.payment_status === "completed" && (
              <Button
                variant="outline"
                onClick={handleRefund}
                disabled={isRefunding}
                className="text-red-600 hover:text-red-700"
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Process Refund
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

