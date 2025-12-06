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
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  Filter,
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

interface HealthContent {
  id: string;
  title: string;
  description?: string;
  category: string;
  content_type: string;
  language: string;
  content_text?: string;
  audio_url?: string;
  video_url?: string;
  duration_minutes: number;
  download_count: number;
  rating: number;
  is_offline_available: boolean;
  topics: string[];
  created_at: string;
}

export default function ContentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [content, setContent] = useState<HealthContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<HealthContent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    content_type: "article",
    language: "English",
    content_text: "",
    audio_url: "",
    video_url: "",
    duration_minutes: 0,
    is_offline_available: false,
    topics: "",
  });

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.role !== "Admin")) {
      router.push("/unauthorized");
      return;
    }

    if (isLoggedIn && user?.role === "Admin") {
      fetchContent();
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/health-content");
      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }
      const data = await response.json();
      setContent(data.content || []);
    } catch (err) {
      console.error("Error fetching content:", err);
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load content",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingContent(null);
    setFormData({
      title: "",
      description: "",
      category: "",
      content_type: "article",
      language: "English",
      content_text: "",
      audio_url: "",
      video_url: "",
      duration_minutes: 0,
      is_offline_available: false,
      topics: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: HealthContent) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      category: item.category,
      content_type: item.content_type,
      language: item.language,
      content_text: item.content_text || "",
      audio_url: item.audio_url || "",
      video_url: item.video_url || "",
      duration_minutes: item.duration_minutes,
      is_offline_available: item.is_offline_available,
      topics: item.topics?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingContent
        ? `/api/admin/health-content/${editingContent.id}`
        : "/api/admin/health-content";
      const method = editingContent ? "PATCH" : "POST";

      const payload = {
        ...formData,
        topics: formData.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save content");
      }

      addToast({
        type: "success",
        title: "Success",
        description: `Content ${editingContent ? "updated" : "created"} successfully`,
      });

      setIsDialogOpen(false);
      fetchContent();
    } catch (err) {
      console.error("Error saving content:", err);
      addToast({
        type: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save content",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/health-content/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete content");
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Content deleted successfully",
      });

      fetchContent();
    } catch (err) {
      console.error("Error deleting content:", err);
      addToast({
        type: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete content",
      });
    }
  };

  const categories = [...new Set(content.map((c) => c.category))];
  const filteredContent = content.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminHeader
        title="Health Content Management"
        description="Create and manage health education content"
      />

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search content by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Content ({filteredContent.length})</CardTitle>
          <CardDescription>
            Manage health education articles, audio, and video content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No content found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.content_type === "video"
                            ? "default"
                            : item.content_type === "audio"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {item.content_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.language}</TableCell>
                    <TableCell>{item.download_count}</TableCell>
                    <TableCell>{item.rating.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? "Edit Content" : "Add New Content"}
            </DialogTitle>
            <DialogDescription>
              {editingContent
                ? "Update health education content"
                : "Create new health education content"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="content_type">Content Type *</Label>
                <select
                  id="content_type"
                  value={formData.content_type}
                  onChange={(e) =>
                    setFormData({ ...formData, content_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="article">Article</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <Label htmlFor="language">Language *</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration_minutes">Duration (Minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="0"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              {formData.content_type === "article" && (
                <div className="md:col-span-2">
                  <Label htmlFor="content_text">Content Text</Label>
                  <Textarea
                    id="content_text"
                    value={formData.content_text}
                    onChange={(e) =>
                      setFormData({ ...formData, content_text: e.target.value })
                    }
                    rows={6}
                  />
                </div>
              )}
              {formData.content_type === "audio" && (
                <div className="md:col-span-2">
                  <Label htmlFor="audio_url">Audio URL</Label>
                  <Input
                    id="audio_url"
                    type="url"
                    value={formData.audio_url}
                    onChange={(e) =>
                      setFormData({ ...formData, audio_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              )}
              {formData.content_type === "video" && (
                <div className="md:col-span-2">
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) =>
                      setFormData({ ...formData, video_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <Label htmlFor="topics">Topics (comma-separated)</Label>
                <Input
                  id="topics"
                  value={formData.topics}
                  onChange={(e) =>
                    setFormData({ ...formData, topics: e.target.value })
                  }
                  placeholder="maternal health, nutrition, vaccination"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_offline_available"
                  checked={formData.is_offline_available}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_offline_available: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_offline_available">
                  Available for offline download
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editingContent ? "Update" : "Create"} Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

