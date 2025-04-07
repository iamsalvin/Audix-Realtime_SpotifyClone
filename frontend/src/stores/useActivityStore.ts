import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { Song } from "@/types";

interface ActivitySong extends Song {
  playCount: number;
  playDuration: number;
  lastPlayed: Date;
}

interface TopArtist {
  artist: string;
  totalPlayCount: number;
  totalPlayDuration: number;
}

interface ListeningSummary {
  uniqueSongsCount: number;
  totalPlayCount: number;
  totalPlayDuration: number;
  uniqueArtistsCount: number;
}

interface ActivityData {
  recentlyPlayed: ActivitySong[];
  mostPlayed: ActivitySong[];
  topArtists: TopArtist[];
  listeningSummary: ListeningSummary;
}

interface ActivityStore {
  isLoading: boolean;
  error: string | null;
  activityData: ActivityData | null;
  lastFetchTime: number | null;

  // Methods
  fetchActivityData: (forceRefresh?: boolean) => Promise<void>;
  logSongPlay: (songId: string, playDuration: number) => Promise<void>;
  reset: () => void;
}

// Default empty activity data structure
const defaultActivityData: ActivityData = {
  recentlyPlayed: [],
  mostPlayed: [],
  topArtists: [],
  listeningSummary: {
    uniqueSongsCount: 0,
    totalPlayCount: 0,
    totalPlayDuration: 0,
    uniqueArtistsCount: 0,
  },
};

// Maximum age of cached data in milliseconds (5 minutes)
const MAX_CACHE_AGE = 5 * 60 * 1000;

export const useActivityStore = create<ActivityStore>((set, get) => ({
  isLoading: false,
  error: null,
  activityData: null,
  lastFetchTime: null,

  fetchActivityData: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Skip fetching if we have recent data and not forcing refresh
    if (
      !forceRefresh &&
      state.activityData &&
      state.lastFetchTime &&
      now - state.lastFetchTime < MAX_CACHE_AGE
    ) {
      console.log("Using cached activity data");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Check if token exists in headers (indicates logged in user)
      const hasAuthToken =
        !!axiosInstance.defaults.headers.common["Authorization"];
      console.log(
        `User authentication status: ${
          hasAuthToken ? "Authenticated" : "Guest"
        }`
      );

      // For guest users, return empty data after a short delay
      if (!hasAuthToken) {
        console.log("Guest user detected, returning empty activity data");
        // Small delay to prevent UI flashing
        await new Promise((resolve) => setTimeout(resolve, 300));

        set({
          activityData: defaultActivityData,
          lastFetchTime: Date.now(),
          error: null,
          isLoading: false,
        });
        return;
      }

      // For authenticated users, make up to 3 attempts to fetch data
      let attempts = 0;
      let success = false;
      let finalError = null;
      let data = null;

      while (attempts < 3 && !success) {
        try {
          console.log(`Attempt ${attempts + 1} to fetch activity data`);
          const response = await axiosInstance.get("/activity/all");

          if (response && response.data) {
            data = response.data;
            success = true;
          } else {
            throw new Error("Invalid response from server");
          }
        } catch (error: any) {
          finalError = error;
          console.error(`Attempt ${attempts + 1} failed:`, error);

          // If we get a 401/403 error, user might not be properly authenticated
          if (
            error?.response?.status === 401 ||
            error?.response?.status === 403
          ) {
            console.log("Authentication error detected, returning empty data");
            set({
              activityData: defaultActivityData,
              lastFetchTime: Date.now(),
              error: null,
            });
            break; // Exit the retry loop
          }

          // Wait longer between each retry
          if (attempts < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * Math.pow(2, attempts))
            );
          }

          attempts++;
        }
      }

      // If we didn't break out early due to auth error and still failed, throw error
      if (!success && !data && attempts >= 3) {
        throw (
          finalError ||
          new Error("Failed to fetch activity data after multiple attempts")
        );
      }

      // If we have data, process it
      if (data) {
        console.log("Activity data received:", {
          recentlyPlayedCount: Array.isArray(data.recentlyPlayed)
            ? data.recentlyPlayed.length
            : 0,
          mostPlayedCount: Array.isArray(data.mostPlayed)
            ? data.mostPlayed.length
            : 0,
          topArtistsCount: Array.isArray(data.topArtists)
            ? data.topArtists.length
            : 0,
          hasSummary: !!data.listeningSummary,
        });

        const validData = {
          recentlyPlayed: Array.isArray(data.recentlyPlayed)
            ? data.recentlyPlayed
            : [],
          mostPlayed: Array.isArray(data.mostPlayed) ? data.mostPlayed : [],
          topArtists: Array.isArray(data.topArtists) ? data.topArtists : [],
          listeningSummary:
            data.listeningSummary || defaultActivityData.listeningSummary,
        };

        set({
          activityData: validData,
          lastFetchTime: Date.now(),
          error: null,
        });
      }
    } catch (error: any) {
      console.error("All attempts to fetch activity data failed:", error);
      // Set empty data instead of just error
      set({
        activityData: defaultActivityData,
        error:
          error?.response?.data?.message || "Failed to fetch activity data",
        isLoading: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logSongPlay: async (songId: string, playDuration: number) => {
    try {
      console.log(
        `Logging song play: songId=${songId}, duration=${playDuration}s`
      );

      // Post the song play to the server
      const response = await axiosInstance.post("/activity/log", {
        songId,
        playDuration,
      });

      console.log("Song play logged successfully:", response.data);

      // Immediately trigger a refresh with a minimal delay
      // The minimal delay ensures the database has updated on the server side
      setTimeout(async () => {
        try {
          console.log("Immediately refreshing activity data after song play");
          // Force refresh to ensure we get the latest data
          await get().fetchActivityData(true);
          console.log("Activity data refreshed successfully after song play");
        } catch (refreshError) {
          console.error(
            "Failed to refresh activity data after song play:",
            refreshError
          );
          // Try one more time with a longer delay
          setTimeout(() => {
            get().fetchActivityData(true);
          }, 1000);
        }
      }, 300); // Reduced delay for immediate feedback
    } catch (error: any) {
      console.error("Error logging song play:", error);
      // If there was an error logging the play, still try to refresh activity data
      setTimeout(() => {
        get().fetchActivityData(true);
      }, 500);
    }
  },

  reset: () => {
    set({
      isLoading: false,
      error: null,
      activityData: null,
      lastFetchTime: null,
    });
  },
}));
