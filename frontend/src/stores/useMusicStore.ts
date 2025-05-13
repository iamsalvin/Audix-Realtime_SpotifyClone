import { axiosInstance } from "@/lib/axios";
import { Album, Song, Stats } from "@/types";
import toast from "react-hot-toast";
import { create } from "zustand";
import { usePremiumStore } from "./usePremiumStore";

// Cache storage with expiration
const songCache = {
  data: new Map<string, { data: any; timestamp: number }>(),
  get: function (key: string) {
    const item = this.data.get(key);
    if (!item) return null;

    // Cache expires after 5 minutes
    if (Date.now() - item.timestamp > 5 * 60 * 1000) {
      this.data.delete(key);
      return null;
    }

    return item.data;
  },
  set: function (key: string, data: any) {
    this.data.set(key, { data, timestamp: Date.now() });
  },
};

interface MusicStore {
  songs: Song[];
  albums: Album[];
  isLoading: boolean;
  error: string | null;
  currentAlbum: Album | null;
  featuredSongs: Song[];
  madeForYouSongs: Song[];
  trendingSongs: Song[];
  stats: Stats;

  fetchAlbums: () => Promise<void>;
  fetchAlbumById: (id: string) => Promise<void>;
  fetchFeaturedSongs: () => Promise<void>;
  fetchMadeForYouSongs: () => Promise<void>;
  fetchTrendingSongs: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchSongs: () => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  clearErrors: () => void;
  reloadData: () => void;
  fetchAdminSongs: () => Promise<void>;
  clearStatsCache: () => void;
  setStats: (updater: (prevStats: Stats) => Stats) => void;
}

// Helper function to safely check premium status
const isPremiumUser = () => {
  try {
    const premiumState = usePremiumStore.getState();
    return premiumState?.premiumStatus?.isPremium || false;
  } catch (error) {
    console.error("Error checking premium status:", error);
    return false;
  }
};

export const useMusicStore = create<MusicStore>((set, get) => ({
  albums: [],
  songs: [],
  isLoading: false,
  error: null,
  currentAlbum: null,
  madeForYouSongs: [],
  featuredSongs: [],
  trendingSongs: [],
  stats: {
    totalSongs: 0,
    totalAlbums: 0,
    totalUsers: 0,
    totalArtists: 0,
    premiumUsers: 0,
    premiumPercentage: 0,
  },

  clearErrors: () => set({ error: null }),

  clearStatsCache: () => {
    songCache.data.delete("stats");
    console.log("Stats cache cleared");
  },

  reloadData: async () => {
    // Clear cache
    songCache.data.clear();

    // Force reload everything
    await Promise.allSettled([
      get().fetchSongs(),
      get().fetchAlbums(),
      get().fetchFeaturedSongs(),
      get().fetchMadeForYouSongs(),
      get().fetchTrendingSongs(),
      get().fetchStats(),
    ]);
  },

  deleteSong: async (id) => {
    try {
      set({ isLoading: true, error: null });

      // Make the API call
      await axiosInstance.delete(`/admin/songs/${id}`);

      // Update local state
      set((state) => ({
        songs: state.songs.filter((song) => song._id !== id),
        isLoading: false,
      }));

      // Also clear cache to ensure fresh data on next fetch
      songCache.data.delete("allSongs");

      return Promise.resolve(); // Return resolved promise on success
    } catch (error: any) {
      console.error("Error in deleteSong", error);

      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete song",
        isLoading: false,
      });

      // Re-throw for caller handling
      return Promise.reject(error);
    }
  },

  deleteAlbum: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/admin/albums/${id}`);
      set((state) => ({
        albums: state.albums.filter((album) => album._id !== id),
        songs: state.songs.map((song) =>
          song.albumId === state.albums.find((a) => a._id === id)?.title
            ? { ...song, album: null }
            : song
        ),
      }));
      toast.success("Album deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete album: " + error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSongs: async () => {
    try {
      // Check if we have a cached version
      const cachedSongs = songCache.get("allSongs");
      if (cachedSongs) {
        set({ songs: cachedSongs, isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });

      // Try fetching from admin endpoint first
      try {
        // Note: The admin-protected endpoint is at /songs, not /admin/songs
        const response = await axiosInstance.get("/songs");
        if (response.status === 200) {
          // Process the data to ensure createdAt exists
          const processedSongs = response.data.map((song: any) => ({
            ...song,
            createdAt: song.createdAt || new Date().toISOString(),
          }));

          songCache.set("allSongs", processedSongs);
          set({ songs: processedSongs, isLoading: false });
          console.log("Successfully loaded songs from admin endpoint");
          return;
        }
      } catch (adminError) {
        console.log(
          "Admin songs endpoint failed, trying public endpoints",
          adminError
        );
      }

      // If admin endpoint fails, try the public song endpoints
      try {
        console.log("Falling back to public song routes");
        const [featured, madeForYou, trending] = await Promise.all([
          axiosInstance.get("/songs/featured"),
          axiosInstance.get("/songs/made-for-you"),
          axiosInstance.get("/songs/trending"),
        ]);

        // Combine and deduplicate songs
        const combinedSongs = [
          ...(featured.data || []),
          ...(madeForYou.data || []),
          ...(trending.data || []),
        ];

        // Remove duplicates by ID
        const uniqueSongs = Array.from(
          new Map(combinedSongs.map((song) => [song._id, song])).values()
        );

        // Ensure all songs have a createdAt field
        const processedSongs = uniqueSongs.map((song: any) => ({
          ...song,
          createdAt: song.createdAt || new Date().toISOString(),
        }));

        songCache.set("allSongs", processedSongs);
        set({ songs: processedSongs, isLoading: false });
      } catch (error: any) {
        console.error("All song route attempts failed:", error);
        set({
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to fetch songs",
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error("Error fetching songs:", error);
      set({
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch songs",
        isLoading: false,
      });
    }
  },

  // Admin-specific method to fetch and refresh all songs
  fetchAdminSongs: async () => {
    // Optimistic UI update - keep existing songs while loading new ones
    set((state) => ({
      isLoading: true,
      error: null,
      // Keep the existing songs visible while we load new ones
      // This prevents the UI from showing a loading spinner
    }));

    // Clear the cache to ensure fresh data
    songCache.data.delete("allSongs");
    songCache.data.delete("stats");

    try {
      // Start multiple requests in parallel for faster loading
      const [songsPromise, statsPromise] = await Promise.allSettled([
        // Primary admin songs endpoint
        axiosInstance.get("/songs"),
        // Also refresh stats in the background while we're at it
        axiosInstance.get("/api/stats"),
      ]);

      // Process songs if available
      if (
        songsPromise.status === "fulfilled" &&
        songsPromise.value.status === 200
      ) {
        const response = songsPromise.value;

        // Process the data to ensure createdAt exists
        const processedSongs = response.data.map((song: any) => ({
          ...song,
          createdAt: song.createdAt || new Date().toISOString(),
        }));

        // Store in cache and update state
        songCache.set("allSongs", processedSongs);
        set({ songs: processedSongs, isLoading: false });
        console.log("Successfully loaded admin songs");
      } else {
        throw new Error("Failed to fetch songs");
      }

      // Also update stats if available (don't wait for this)
      if (
        statsPromise.status === "fulfilled" &&
        statsPromise.value.status === 200
      ) {
        const rawStats = statsPromise.value.data || {};
        const processedStats = {
          totalSongs: rawStats.totalSongs || 0,
          totalAlbums: rawStats.totalAlbums || 0,
          totalUsers: rawStats.totalUsers || 0,
          totalArtists: rawStats.totalArtists || 0,
          premiumUsers: rawStats.premiumUsers || 0,
          premiumPercentage: rawStats.premiumPercentage || 0,
        };

        // Calculate premium percentage if not provided
        if (!rawStats.premiumPercentage && rawStats.totalUsers > 0) {
          processedStats.premiumPercentage = Math.round(
            (processedStats.premiumUsers / processedStats.totalUsers) * 100
          );
        }

        songCache.set("stats", processedStats);
        set({ stats: processedStats });
      }
    } catch (error: any) {
      console.error("Error fetching admin songs:", error);

      // Show error but don't clear existing songs
      set((state) => ({
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch songs",
        isLoading: false,
      }));

      // Try public endpoints as fallback without waiting
      try {
        console.log("Falling back to public song routes");
        Promise.all([
          axiosInstance.get("/songs/featured"),
          axiosInstance.get("/songs/made-for-you"),
          axiosInstance.get("/songs/trending"),
        ])
          .then(([featured, madeForYou, trending]) => {
            // Combine and deduplicate songs
            const combinedSongs = [
              ...(featured.data || []),
              ...(madeForYou.data || []),
              ...(trending.data || []),
            ];

            // Remove duplicates by ID
            const uniqueSongs = Array.from(
              new Map(combinedSongs.map((song) => [song._id, song])).values()
            );

            // Ensure all songs have a createdAt field
            const processedSongs = uniqueSongs.map((song: any) => ({
              ...song,
              createdAt: song.createdAt || new Date().toISOString(),
            }));

            songCache.set("allSongs", processedSongs);
            set({ songs: processedSongs, isLoading: false });
          })
          .catch((err) => {
            console.error("Public song routes fallback failed:", err);
          });
      } catch (fallbackError) {
        console.error("Error setting up fallback:", fallbackError);
      }
    }
  },

  fetchStats: async () => {
    try {
      // Check if we have a cached version
      const cachedStats = songCache.get("stats");
      if (cachedStats) {
        set({ stats: cachedStats, isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });

      // Try multiple endpoints
      const endpoints = ["/api/stats", "/stats", "/analytics/stats"];
      let success = false;

      for (const endpoint of endpoints) {
        try {
          const response = await axiosInstance.get(endpoint);

          if (response.status === 200) {
            // Ensure all expected properties exist with defaults for missing ones
            const rawStats = response.data || {};
            const processedStats = {
              totalSongs: rawStats.totalSongs || 0,
              totalAlbums: rawStats.totalAlbums || 0,
              totalUsers: rawStats.totalUsers || 0,
              totalArtists: rawStats.totalArtists || 0,
              premiumUsers: rawStats.premiumUsers || 0,
              premiumPercentage: rawStats.premiumPercentage || 0,
            };

            // Calculate premium percentage if not provided but we have the user counts
            if (!rawStats.premiumPercentage && rawStats.totalUsers > 0) {
              processedStats.premiumPercentage = Math.round(
                (processedStats.premiumUsers / processedStats.totalUsers) * 100
              );
            }

            songCache.set("stats", processedStats);
            set({ stats: processedStats, isLoading: false });
            success = true;
            break;
          }
        } catch (error) {
          // Silent error, just continue to next endpoint
        }
      }

      if (!success) {
        throw new Error("Failed to fetch stats from any endpoint");
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      set({
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch stats",
        isLoading: false,
      });
    }
  },

  fetchAlbums: async () => {
    try {
      // Check if we have a cached version
      const cachedAlbums = songCache.get("albums");
      if (cachedAlbums) {
        set({ albums: cachedAlbums, isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });
      const response = await axiosInstance.get("/albums");
      if (response.status === 200) {
        songCache.set("albums", response.data);
        set({ albums: response.data, isLoading: false });
      }
    } catch (error: any) {
      console.error("Error fetching albums:", error);
      set({
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch albums",
        isLoading: false,
      });
    }
  },

  fetchAlbumById: async (id) => {
    try {
      // Check if we have a cached version
      const cacheKey = `album_${id}`;
      const cachedAlbum = songCache.get(cacheKey);
      if (cachedAlbum) {
        set({ currentAlbum: cachedAlbum, isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });
      const response = await axiosInstance.get(`/albums/${id}`);
      if (response.status === 200) {
        songCache.set(cacheKey, response.data);
        set({ currentAlbum: response.data, isLoading: false });
      }
    } catch (error: any) {
      console.error(`Error fetching album ${id}:`, error);
      set({
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch album",
        isLoading: false,
      });
    }
  },

  fetchFeaturedSongs: async () => {
    try {
      // Check if we have a cached version
      const cachedFeatured = songCache.get("featured");
      if (cachedFeatured) {
        set({ featuredSongs: cachedFeatured, isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });
      const response = await axiosInstance.get("/songs/featured");
      if (response.status === 200) {
        // Filter based on premium status if needed
        const isPremium = isPremiumUser();
        let songs = response.data;

        if (!isPremium) {
          // If not premium, limit access to certain songs
          songs = songs.filter((song: any) => !song.premiumOnly).slice(0, 5);
        }

        songCache.set("featured", songs);
        set({ featuredSongs: songs, isLoading: false });
      }
    } catch (error: any) {
      console.error("Error fetching featured songs:", error);
      set({
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch featured songs",
        isLoading: false,
      });
    }
  },

  fetchMadeForYouSongs: async () => {
    try {
      // Check if we have a cached version
      const cachedMadeForYou = songCache.get("madeForYou");
      if (cachedMadeForYou) {
        set({ madeForYouSongs: cachedMadeForYou, isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });
      const response = await axiosInstance.get("/songs/made-for-you");
      if (response.status === 200) {
        // Filter based on premium status if needed
        const isPremium = isPremiumUser();
        let songs = response.data;

        if (!isPremium) {
          // If not premium, limit access to certain songs
          songs = songs.filter((song: any) => !song.premiumOnly).slice(0, 5);
        }

        songCache.set("madeForYou", songs);
        set({ madeForYouSongs: songs, isLoading: false });
      }
    } catch (error: any) {
      console.error("Error fetching made for you songs:", error);
      set({
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch made for you songs",
        isLoading: false,
      });
    }
  },

  fetchTrendingSongs: async () => {
    try {
      // Check if we have a cached version
      const cachedTrending = songCache.get("trending");
      if (cachedTrending) {
        set({ trendingSongs: cachedTrending, isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });
      const response = await axiosInstance.get("/songs/trending");
      if (response.status === 200) {
        // Filter based on premium status if needed
        const isPremium = isPremiumUser();
        let songs = response.data;

        if (!isPremium) {
          // If not premium, limit access to certain songs
          songs = songs.filter((song: any) => !song.premiumOnly).slice(0, 5);
        }

        songCache.set("trending", songs);
        set({ trendingSongs: songs, isLoading: false });
      }
    } catch (error: any) {
      console.error("Error fetching trending songs:", error);
      set({
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch trending songs",
        isLoading: false,
      });
    }
  },

  setStats: (updater) => set((state) => ({ stats: updater(state.stats) })),
}));
