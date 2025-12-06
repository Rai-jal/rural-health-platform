"use client";

import { useState, useEffect } from "react";
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
import {
  Users,
  MessageSquare,
  Calendar,
  MapPin,
  Phone,
  ArrowLeft,
  Clock,
  UserPlus,
  Megaphone,
  BookOpen,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  getCommunityGroups,
  getUpcomingEvents,
  type CommunityGroup,
  type Event,
} from "@/lib/api/client";

export default function CommunityPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState("groups");
  const [communityGroups, setCommunityGroups] = useState<CommunityGroup[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login?redirect=/community");
      return;
    }

    // Load data if authenticated
    if (isLoggedIn) {
      loadCommunityData();
    }
  }, [authLoading, isLoggedIn, router]);

  const loadCommunityData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [groupsResult, eventsResult] = await Promise.all([
        getCommunityGroups(),
        getUpcomingEvents(),
      ]);

      if (groupsResult.error) {
        setError(groupsResult.error);
        return;
      }
      if (eventsResult.error) {
        setError(eventsResult.error);
        return;
      }

      setCommunityGroups(groupsResult.data || []);
      setUpcomingEvents(eventsResult.data || []);
    } catch (error) {
      console.error("Error loading community data:", error);
      setError("Failed to load community data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const recentDiscussions = [
    {
      id: "1",
      title: "Best foods during pregnancy with local ingredients",
      author: "Aminata K.",
      group: "Pregnancy Journey",
      replies: 12,
      lastReply: "1 hour ago",
      category: "Nutrition",
    },
    {
      id: "2",
      title: "Managing morning sickness naturally",
      author: "Fatima S.",
      group: "New Mothers Support",
      replies: 8,
      lastReply: "2 hours ago",
      category: "Pregnancy",
    },
    {
      id: "3",
      title: "When to introduce solid foods to babies",
      author: "Mariama B.",
      group: "Child Nutrition Circle",
      replies: 15,
      lastReply: "3 hours ago",
      category: "Child Care",
    },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>
            {authLoading
              ? "Checking authentication..."
              : "Loading community data..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={loadCommunityData}>Retry</Button>
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
              Community Support
            </h1>
            <p className="text-gray-600">
              Connect with other women and health advocates
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeTab === "groups" ? "default" : "outline"}
            onClick={() => setActiveTab("groups")}
            className="flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Support Groups</span>
          </Button>
          <Button
            variant={activeTab === "events" ? "default" : "outline"}
            onClick={() => setActiveTab("events")}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Events</span>
          </Button>
          <Button
            variant={activeTab === "discussions" ? "default" : "outline"}
            onClick={() => setActiveTab("discussions")}
            className="flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Discussions</span>
          </Button>
        </div>

        {/* Support Groups Tab */}
        {activeTab === "groups" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Support Groups</h2>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Join a Group
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {communityGroups.map((group) => (
                <Card
                  key={group.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">{group.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{group.member_count} members</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-xs">{group.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 col-span-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-xs">{group.language}</span>
                      </div>
                    </div>

                    {group.healthcare_providers && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Moderated by:
                        </p>
                        <p className="text-sm text-gray-600">
                          {group.healthcare_providers.full_name} -{" "}
                          {group.healthcare_providers.specialty}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">
                        Join Group
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Voice Access for Groups */}
            <Card className="mt-8 bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    Join Groups via Phone
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Participate in support groups even without internet access
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-4">
                      <p className="font-semibold mb-2">Conference Calls:</p>
                      <p>
                        Dial <strong>*123*GROUP#</strong> for scheduled group
                        calls
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="font-semibold mb-2">SMS Updates:</p>
                      <p>
                        Text <strong>JOIN [GROUP]</strong> to{" "}
                        <strong>1234</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>

            <div className="space-y-6">
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-100 rounded-lg p-3">
                        <Calendar className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">
                              {event.title}
                            </h3>
                            <p className="text-gray-600 mb-3">
                              {event.description}
                            </p>
                          </div>
                          <Badge variant="outline">{event.event_type}</Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(event.scheduled_at)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{event.current_attendees} attending</span>
                          </div>
                        </div>

                        {event.healthcare_providers && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              Organized by:{" "}
                              <span className="font-medium">
                                {event.healthcare_providers.full_name}
                              </span>
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button size="sm">Register</Button>
                          <Button size="sm" variant="outline">
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === "discussions" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Discussions</h2>
              <Button>
                <Megaphone className="h-4 w-4 mr-2" />
                Start Discussion
              </Button>
            </div>

            <div className="space-y-4">
              {recentDiscussions.map((discussion) => (
                <Card
                  key={discussion.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {discussion.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span>by {discussion.author}</span>
                          <span>in {discussion.group}</span>
                          <Badge variant="secondary" className="text-xs">
                            {discussion.category}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{discussion.replies} replies</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Last reply {discussion.lastReply}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Join Discussion
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Community Guidelines */}
        <Card className="mt-12 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <BookOpen className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Community Guidelines
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>
                    • Be respectful and supportive to all community members
                  </li>
                  <li>
                    • Share experiences and advice, but remember everyone&apos;s
                    situation is unique
                  </li>
                  <li>
                    • Protect privacy - don&apos;t share personal medical
                    information publicly
                  </li>
                  <li>
                    • For medical emergencies, contact healthcare providers
                    immediately
                  </li>
                  <li>
                    • Report inappropriate content to community moderators
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
