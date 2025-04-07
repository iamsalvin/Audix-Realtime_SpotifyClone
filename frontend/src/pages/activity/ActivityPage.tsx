import { useEffect, useState, useCallback } from "react";
import { useActivityStore } from "@/stores/useActivityStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Clock,
  User2,
  Play,
  Music,
  ListMusic,
  BarChart3,
  RefreshCcw,
} from "lucide-react";
import SongCard from "@/components/SongCard";
import { useUser } from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";
import Topbar from "@/components/Topbar";
import { Song } from "@/types";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { usePlayerStore } from "@/stores/usePlayerStore";

// Helper function to format time
const formatTime = (seconds: number): string => {
  if (!seconds) return "0 mins";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""} ${mins} min${
      mins > 1 ? "s" : ""
    }`;
  }

  return `${mins} min${mins > 1 ? "s" : ""}`;
};

const ActivitySkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

const ActivityPage = () => {
  const { fetchActivityData, activityData, isLoading, error, reset } =
    useActivityStore();
  const {
    isAdmin,
    isLoading: isAuthLoading,
    checkAdminStatus,
  } = useAuthStore();
  const { currentSong } = usePlayerStore();
  const { user } = useUser();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    toast.success("Refreshing activity data...");
    reset();
    fetchActivityData(true);
  }, [fetchActivityData, reset]);

  // First, ensure admin status is checked
  useEffect(() => {
    const checkAuth = async () => {
      await checkAdminStatus();
    };

    checkAuth();
  }, [checkAdminStatus]);

  // Listen for song changes - this will help us refresh when songs change
  useEffect(() => {
    if (currentSong) {
      console.log("Song changed, will refresh activity data shortly");
      // Wait a short moment after song change to refresh (to allow logging to complete)
      const refreshTimeout = setTimeout(() => {
        console.log("Refreshing activity after song change");
        fetchActivityData(true);
      }, 2000);

      return () => clearTimeout(refreshTimeout);
    }
  }, [currentSong, fetchActivityData]);

  // Auto-refresh effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      // More frequent refresh for a better user experience
      intervalId = setInterval(() => {
        console.log("Auto-refreshing activity data...");
        // Always force refresh on auto-refresh
        fetchActivityData(true);
      }, 15000); // Refresh every 15 seconds when auto-refresh is on
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, fetchActivityData]);

  // Then load activity data with a simpler, more reliable approach
  useEffect(() => {
    // Only proceed if auth check is complete
    if (isAuthLoading) return;

    const loadData = async () => {
      try {
        // For initial load, show toast
        if (isInitialLoad) {
          toast.loading("Loading your activity data...", {
            id: "activity-loading",
          });
        }

        // Clear any previous data
        reset();

        // Always fetch with force refresh to ensure we get the latest data
        console.log("Fetching activity data for user...");
        await fetchActivityData(true);
        console.log("Activity data fetched successfully");

        // Success toast
        if (isInitialLoad) {
          toast.success("Activity data loaded successfully", {
            id: "activity-loading",
          });
          setIsInitialLoad(false);
        }
      } catch (err) {
        console.error("Failed to load activity data:", err);
        toast.error("Failed to load activity data. Try refreshing.", {
          id: "activity-loading",
        });
      }
    };

    // Set a timeout to ensure we don't get stuck in loading state
    const timeoutId = setTimeout(() => {
      if (isInitialLoad) {
        console.log("Loading timeout reached, dismissing loading toast");
        toast.dismiss("activity-loading");
        setIsInitialLoad(false);
      }
    }, 10000); // 10 second timeout

    loadData();

    // Also set up a "focus" event listener to refresh data when the user
    // comes back to this page after being on another page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Page became visible, refreshing activity data");
        fetchActivityData(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      toast.dismiss("activity-loading");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchActivityData, isAdmin, isAuthLoading, reset, isInitialLoad]);

  const formatDate = (dateString: Date | string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Determine if we should show loading state
  const showLoading = isLoading || isAuthLoading;

  // Determine if we should show empty state
  const showEmptyState =
    !showLoading &&
    (!activityData ||
      (activityData?.recentlyPlayed?.length === 0 &&
        activityData?.mostPlayed?.length === 0 &&
        activityData?.topArtists?.length === 0));

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/20">
                <AvatarImage
                  src={user?.imageUrl}
                  alt={user?.fullName || "User"}
                />
                <AvatarFallback>
                  <User2 className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {user?.fullName || "Your"} Activity
                </h1>
                <p className="text-zinc-400">
                  Your listening stats and history
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </div>
          )}

          {showLoading ? (
            <ActivitySkeleton />
          ) : showEmptyState ? (
            <div className="text-center py-12">
              <Music className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Activity Yet</h2>
              <p className="text-zinc-400 mb-6">
                Start listening to music to see your activity here!
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Stats Summary */}
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Listening Stats
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-800/50 p-4 rounded-xl flex flex-col items-center text-center">
                    <Play className="h-8 w-8 mb-2 text-emerald-500" />
                    <div className="text-2xl font-bold">
                      {activityData?.listeningSummary?.totalPlayCount || 0}
                    </div>
                    <div className="text-sm text-zinc-400">Total Plays</div>
                  </div>

                  <div className="bg-zinc-800/50 p-4 rounded-xl flex flex-col items-center text-center">
                    <Clock className="h-8 w-8 mb-2 text-amber-500" />
                    <div className="text-2xl font-bold">
                      {formatTime(
                        activityData?.listeningSummary?.totalPlayDuration || 0
                      )}
                    </div>
                    <div className="text-sm text-zinc-400">Listening Time</div>
                  </div>

                  <div className="bg-zinc-800/50 p-4 rounded-xl flex flex-col items-center text-center">
                    <Music className="h-8 w-8 mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">
                      {activityData?.listeningSummary?.uniqueSongsCount || 0}
                    </div>
                    <div className="text-sm text-zinc-400">Unique Songs</div>
                  </div>

                  <div className="bg-zinc-800/50 p-4 rounded-xl flex flex-col items-center text-center">
                    <User2 className="h-8 w-8 mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">
                      {activityData?.listeningSummary?.uniqueArtistsCount || 0}
                    </div>
                    <div className="text-sm text-zinc-400">Artists</div>
                  </div>
                </div>
              </section>

              {/* Top Artists */}
              {activityData &&
                activityData.topArtists &&
                activityData.topArtists.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <User2 className="h-5 w-5" />
                      Your Top Artists
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activityData.topArtists.map((artist, index) => (
                        <div
                          key={artist.artist}
                          className="bg-zinc-800/30 p-4 rounded-lg flex items-center gap-3"
                        >
                          <div className="h-12 w-12 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg">
                              {artist.artist}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {artist.totalPlayCount} plays ·{" "}
                              {formatTime(artist.totalPlayDuration)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {/* Most Played Songs */}
              {activityData &&
                activityData.mostPlayed &&
                activityData.mostPlayed.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <ListMusic className="h-5 w-5" />
                      Most Played Songs
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {activityData.mostPlayed
                        .slice(0, 10)
                        .map((activity: any) => {
                          // Extract the song data from the populated songId field
                          const song = activity.songId as Song;

                          if (!song) return null;

                          return (
                            <div key={activity._id} className="relative group">
                              <SongCard song={song} />
                              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                {activity.playCount} plays
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </section>
                )}

              {/* Recently Played */}
              {activityData &&
                activityData.recentlyPlayed &&
                activityData.recentlyPlayed.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recently Played
                    </h2>
                    <div className="space-y-2">
                      {activityData.recentlyPlayed.map((activity: any) => {
                        // Extract the song data from the populated songId field
                        const song = activity.songId as Song;

                        if (!song) return null;

                        return (
                          <div
                            key={activity._id}
                            className="bg-zinc-800/30 p-3 rounded-lg flex items-center gap-3"
                          >
                            <div className="h-12 w-12 overflow-hidden rounded-md">
                              <img
                                src={song.imageUrl}
                                alt={song.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">
                                {song.title}
                              </div>
                              <div className="text-sm text-zinc-400 truncate">
                                {song.artist}
                              </div>
                            </div>
                            <div className="text-xs text-zinc-500">
                              {formatDate(activity.lastPlayed)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
            </div>
          )}
        </div>
      </ScrollArea>
    </main>
  );
};

export default ActivityPage;
