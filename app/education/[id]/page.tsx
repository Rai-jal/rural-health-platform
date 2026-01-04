"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Volume2,
  Play,
  Pause,
  Download,
  BookOpen,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { getHealthContent, incrementDownloadCount, type HealthContent } from "@/lib/api/client";

export default function EducationContentPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [content, setContent] = useState<HealthContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login?redirect=/education");
      return;
    }

    if (isLoggedIn && contentId) {
      loadContent();
    }
  }, [authLoading, isLoggedIn, contentId, router]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/health-content/${contentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        addToast({
          type: "error",
          title: "Error",
          description: errorData.error || "Failed to load content",
        });
        router.push("/education");
        return;
      }

      const result = await response.json();
      setContent(result.data);
    } catch (error) {
      console.error("Error loading content:", error);
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load content",
      });
      router.push("/education");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!content?.audio_url) {
      addToast({
        type: "error",
        title: "Audio Not Available",
        description: "Audio file is not available for this content.",
      });
      return;
    }

    if (!audioElement) {
      const audio = new Audio(content.audio_url);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('error', () => {
        addToast({
          type: "error",
          title: "Playback Error",
          description: "Failed to play audio. Please check your connection.",
        });
        setIsPlaying(false);
      });
      setAudioElement(audio);
      audio.play().catch((err) => {
        console.error('Error playing audio:', err);
        addToast({
          type: "error",
          title: "Playback Error",
          description: "Failed to play audio. Please try again.",
        });
      });
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play().catch((err) => {
          console.error('Error playing audio:', err);
          addToast({
            type: "error",
            title: "Playback Error",
            description: "Failed to play audio. Please try again.",
          });
        });
        setIsPlaying(true);
      }
    }
  };

  const handleDownload = async () => {
    if (!content) return;
    
    try {
      const result = await incrementDownloadCount(content.id);
      if (result) {
        addToast({
          type: "success",
          title: "Downloaded",
          description: "Content downloaded successfully!",
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Content Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested content could not be found.</p>
            <Link href="/education">
              <Button>Back to Education</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/education">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{content.title}</CardTitle>
                <CardDescription>{content.description}</CardDescription>
              </div>
              <Badge variant="outline" className="ml-4">
                {content.category}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Content Info */}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Language: {content.language}</span>
              <span>•</span>
              <span>Duration: {content.duration_minutes} min</span>
              {content.download_count !== undefined && (
                <>
                  <span>•</span>
                  <span>{content.download_count} downloads</span>
                </>
              )}
            </div>

            {/* Topics */}
            {content.topics && content.topics.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Topics:</p>
                <div className="flex flex-wrap gap-2">
                  {content.topics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Article Content */}
            {content.content_type === "article" && content.content_text && (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {content.content_text}
                </div>
              </div>
            )}

            {/* Audio Content */}
            {content.content_type === "audio" && content.audio_url && (
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <Volume2 className="h-12 w-12 text-primary" />
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <Button
                    size="lg"
                    onClick={toggleAudio}
                    className="w-full max-w-xs"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Play Audio
                      </>
                    )}
                  </Button>
                  {audioElement && (
                    <audio
                      ref={(el) => {
                        if (el && !audioElement) {
                          setAudioElement(el);
                        }
                      }}
                      src={content.audio_url}
                      className="w-full max-w-md"
                      controls
                      autoPlay={isPlaying}
                    />
                  )}
                  <p className="text-sm text-muted-foreground">
                    Playing in {content.language}
                  </p>
                </div>
              </div>
            )}

            {/* Video Content */}
            {content.content_type === "video" && content.video_url && (
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="aspect-video w-full">
                  <iframe
                    src={content.video_url}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {content.is_offline_available && (
                <Badge variant="secondary" className="flex items-center px-4">
                  <Download className="h-4 w-4 mr-2" />
                  Available Offline
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

