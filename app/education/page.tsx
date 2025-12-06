"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  Volume2,
  Download,
  Search,
  BookOpen,
  Heart,
  Baby,
  Users,
  Utensils,
  Shield,
  ArrowLeft,
  Clock,
  Star,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import {
  getHealthContent,
  incrementDownloadCount,
  type HealthContent,
} from "@/lib/api/client";

export default function EducationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [healthContent, setHealthContent] = useState<HealthContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: "all", name: "All Topics", icon: BookOpen },
    { id: "maternal", name: "Maternal Health", icon: Heart },
    { id: "childcare", name: "Child Care", icon: Baby },
    { id: "nutrition", name: "Nutrition", icon: Utensils },
    { id: "hygiene", name: "Hygiene", icon: Shield },
    { id: "family", name: "Family Planning", icon: Users },
  ];

  const loadHealthContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: apiError } = await getHealthContent({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        search: searchTerm || undefined,
      });
      if (apiError) {
        setError(apiError);
        return;
      }
      setHealthContent(data || []);
    } catch (error) {
      console.error("Error loading health content:", error);
      setError("Failed to load health content");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login?redirect=/education");
      return;
    }

    // Load content if authenticated
    if (isLoggedIn) {
      loadHealthContent();
    }
  }, [authLoading, isLoggedIn, router, loadHealthContent]);

  const toggleAudio = (contentId: string) => {
    if (playingAudio === contentId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(contentId);
    }
  };

  const handleDownload = async (contentId: string) => {
    try {
      const result = await incrementDownloadCount(contentId);
      if (result) {
        // Update local state to reflect the increment
        setHealthContent((prev) =>
          prev.map((content) =>
            content.id === contentId
              ? { ...content, download_count: result.download_count }
              : content
          )
        );
        addToast({
          type: "success",
          title: "Downloaded",
          description: "Content downloaded successfully!",
        });
      } else {
        addToast({
          type: "error",
          title: "Download Failed",
          description: "Failed to download content. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error downloading content:", error);
      addToast({
        type: "error",
        title: "Download Error",
        description: "An error occurred while downloading. Please try again.",
      });
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={loadHealthContent}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Health Education
            </h1>
            <p className="text-gray-600">
              Learn about health topics in your language
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search health topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Offline Access Notice */}
        <Card className="bg-blue-50 border-blue-200 mb-8">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Download className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  Offline Access Available
                </p>
                <p className="text-sm text-blue-700">
                  Download content to access without internet. Audio content
                  works on any phone via *123*2#
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading health content...</p>
          </div>
        )}

        {/* Content Grid */}
        {!isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthContent.map((content) => (
              <Card
                key={content.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {content.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {content.description}
                      </CardDescription>
                    </div>
                    {content.is_offline_available && (
                      <Badge variant="secondary" className="ml-2">
                        <Download className="h-3 w-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Content Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{content.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{content.rating}</span>
                      </div>
                    </div>
                    <span className="text-xs">
                      {content.download_count} downloads
                    </span>
                  </div>

                  {/* Language */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Available in:
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {content.language}
                    </Badge>
                  </div>

                  {/* Topics */}
                  {content.topics && content.topics.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Topics covered:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {content.topics.map((topic) => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio Player */}
                  {content.content_type === "audio" && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Volume2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">
                            Audio Available
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAudio(content.id)}
                        >
                          {playingAudio === content.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {playingAudio === content.id && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full w-1/3"></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Playing in {content.language}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(content.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && healthContent.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No content found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or category filter
            </p>
          </div>
        )}

        {/* Voice Access Info - Simple and Clear Design */}
        <Card className="mt-12 bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="text-center">
              <Volume2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Access via Voice
              </h3>
              <p className="text-green-700 mb-4">
                Listen to health education content on any phone, even without
                internet
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-4">
                  <p className="font-semibold mb-2">For Audio Content:</p>
                  <p>
                    Dial <strong>*123*2#</strong> and follow voice prompts
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="font-semibold mb-2">For SMS Summaries:</p>
                  <p>
                    Text <strong>HEALTH [TOPIC]</strong> to{" "}
                    <strong>1234</strong>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
