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
import {
  Stethoscope,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  X,
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

interface Provider {
  id: string;
  full_name: string;
  specialty: string;
  languages: string[];
  experience_years: number;
  rating: number;
  total_consultations: number;
  location?: string;
  is_available: boolean;
  created_at: string;
}

export default function ProvidersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    specialty: "",
    languages: ["English"],
    experience_years: 0,
    location: "",
    is_available: true,
    // Login credentials (only for new providers)
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.role !== "Admin")) {
      router.push("/unauthorized");
      return;
    }

    if (isLoggedIn && user?.role === "Admin") {
      fetchProviders();
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/providers");
      if (!response.ok) {
        throw new Error("Failed to fetch providers");
      }
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (err) {
      console.error("Error fetching providers:", err);
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load providers",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProvider(null);
    setFormData({
      full_name: "",
      specialty: "",
      languages: ["English"],
      experience_years: 0,
      location: "",
      is_available: true,
      email: "",
      password: "",
      confirmPassword: "",
    });
    setPasswordErrors([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      full_name: provider.full_name,
      specialty: provider.specialty,
      languages: provider.languages || ["English"],
      experience_years: provider.experience_years,
      location: provider.location || "",
      is_available: provider.is_available,
      email: "", // Don't show email in edit mode for security
      password: "",
      confirmPassword: "",
    });
    setPasswordErrors([]);
    setIsDialogOpen(true);
  };

  const validatePassword = (password: string, confirmPassword: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }
    
    return errors;
  };

  const handleSave = async () => {
    // Validate password for new providers
    if (!editingProvider) {
      const errors = validatePassword(formData.password, formData.confirmPassword);
      if (errors.length > 0) {
        setPasswordErrors(errors);
        addToast({
          type: "error",
          title: "Validation Error",
          description: "Please fix the password errors",
        });
        return;
      }
      
      if (!formData.email) {
        addToast({
          type: "error",
          title: "Validation Error",
          description: "Email is required",
        });
        return;
      }
    }

    try {
      const url = editingProvider
        ? `/api/admin/providers/${editingProvider.id}`
        : "/api/admin/providers";
      const method = editingProvider ? "PATCH" : "POST";

      // Prepare payload - exclude password fields for edit, include for create
      const payload = editingProvider
        ? {
            full_name: formData.full_name,
            specialty: formData.specialty,
            languages: formData.languages,
            experience_years: formData.experience_years,
            location: formData.location,
            is_available: formData.is_available,
          }
        : {
            full_name: formData.full_name,
            specialty: formData.specialty,
            languages: formData.languages,
            experience_years: formData.experience_years,
            location: formData.location,
            is_available: formData.is_available,
            email: formData.email,
            password: formData.password,
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save provider");
      }

      addToast({
        type: "success",
        title: "Success",
        description: editingProvider
          ? "Provider updated successfully"
          : "Provider created successfully. Login credentials have been sent via email.",
      });

      setIsDialogOpen(false);
      setPasswordErrors([]);
      fetchProviders();
    } catch (err) {
      console.error("Error saving provider:", err);
      addToast({
        type: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save provider",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/providers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete provider");
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Provider deleted successfully",
      });

      fetchProviders();
    } catch (err) {
      console.error("Error deleting provider:", err);
      addToast({
        type: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete provider",
      });
    }
  };

  const filteredProviders = providers.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminHeader
        title="Healthcare Providers"
        description="Manage all healthcare providers in the system"
      />

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search providers by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Providers ({filteredProviders.length})</CardTitle>
          <CardDescription>
            Manage healthcare provider profiles and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No providers found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">
                      {provider.full_name}
                    </TableCell>
                    <TableCell>{provider.specialty}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {provider.languages?.slice(0, 2).map((lang, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                        {provider.languages && provider.languages.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.languages.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{provider.experience_years} years</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-semibold">
                          {provider.rating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({provider.total_consultations})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={provider.is_available ? "default" : "secondary"}
                      >
                        {provider.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(provider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(provider.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Edit Provider" : "Add New Provider"}
            </DialogTitle>
            <DialogDescription>
              {editingProvider
                ? "Update healthcare provider information"
                : "Create a new healthcare provider profile"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty *</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="experience_years">Experience (Years)</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_years: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  value={formData.languages.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      languages: e.target.value
                        .split(",")
                        .map((l) => l.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="English, French, Krio"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) =>
                    setFormData({ ...formData, is_available: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_available">Available for consultations</Label>
              </div>
            </div>

            {/* Login Credentials Section - Only show for new providers */}
            {!editingProvider && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-4">Login Credentials</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create login credentials for this healthcare provider. They will receive an email with instructions.
                  </p>
                  <div className="grid md:grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setPasswordErrors([]);
                        }}
                        placeholder="provider@example.com"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be unique. Used for login.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (formData.confirmPassword) {
                            setPasswordErrors(
                              validatePassword(e.target.value, formData.confirmPassword)
                            );
                          }
                        }}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          setPasswordErrors(
                            validatePassword(formData.password, e.target.value)
                          );
                        }}
                        placeholder="Confirm password"
                        required
                      />
                      {passwordErrors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {passwordErrors.map((error, idx) => (
                            <p key={idx} className="text-xs text-destructive">
                              • {error}
                            </p>
                          ))}
                        </div>
                      )}
                      {passwordErrors.length === 0 && formData.password && formData.confirmPassword && (
                        <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be at least 8 characters with uppercase, lowercase, and number.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editingProvider ? "Update" : "Create"} Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

