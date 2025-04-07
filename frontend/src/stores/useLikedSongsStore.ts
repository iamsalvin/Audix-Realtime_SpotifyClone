import { axiosInstance } from "@/lib/axios";
import { Song } from "@/types";
import { create } from "zustand";

interface LikedSongsStore {
  likedSongs: Song[];
  likeStatus: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;

  // Fetch all liked songs
  fetchLikedSongs: () => Promise<void>;

  // Toggle like status for a song
  toggleLike: (songId: string) => Promise<boolean>;

  // Check if multiple songs are liked (for displaying in lists)
  checkBulkLikeStatus: (songIds: string[]) => Promise<void>;

  // Reset the store
  reset: () => void;
}

export const useLikedSongsStore = create<LikedSongsStore>((set, get) => ({
  likedSongs: [],
  likeStatus: {},
  isLoading: false,
  error: null,

  fetchLikedSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      // Check if Authorization header is set (user is logged in)
      const hasAuthHeader = !!axiosInstance.defaults.headers.common["Authorization"];
      if (!hasAuthHeader) {
        console.log("User not authenticated, can't fetch liked songs");
        set({ likedSongs: [], likeStatus: {} });
        return;
      }
      
      console.log("Fetching liked songs...");
      const response = await axiosInstance.get("/liked-songs");
      console.log("Liked songs response:", response.data);
      
      // Ensure we have an array of songs
      const songs = Array.isArray(response.data) ? response.data : [];
      set({ likedSongs: songs });
      
      // Update like status map for these songs
      const statusMap: Record<string, boolean> = {};
      songs.forEach((song: Song) => {
        statusMap[song._id] = true;
      });
      
      set((state) => ({
        likeStatus: { ...state.likeStatus, ...statusMap }
      }));
      
      console.log(`Successfully fetched ${songs.length} liked songs`);
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.log("Unauthorized: User not logged in");
        set({ likedSongs: [], likeStatus: {} });
      } else {
        console.error("Error fetching liked songs:", error);
        set({ error: error?.response?.data?.message || "Failed to fetch liked songs" });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLike: async (songId: string) => {
    try {
      // Check if user is authenticated
      const hasAuthHeader = !!axiosInstance.defaults.headers.common["Authorization"];
      if (!hasAuthHeader) {
        console.log("User not authenticated, can't toggle like status");
        return false;
      }
      
      console.log(`Toggling like status for song: ${songId}`);
      const response = await axiosInstance.post("/liked-songs/toggle", { songId });
      const { liked } = response.data;
      console.log(`Song ${songId} is now ${liked ? 'liked' : 'unliked'}`);
      
      // Update like status in the store
      set((state) => ({
        likeStatus: { ...state.likeStatus, [songId]: liked }
      }));
      
      // If the song was liked, add it to the list if not already there
      // If unliked, remove it from the list
      if (liked) {
        // Fetch the song details if it's not in the liked songs list
        const songExists = get().likedSongs.some(song => song._id === songId);
        if (!songExists) {
          console.log("Song not in liked songs list, refreshing list...");
          // After liking, refresh the full liked songs list to get the proper order
          await get().fetchLikedSongs();
        }
      } else {
        // Remove the song from liked songs
        console.log("Removing song from liked songs list");
        set((state) => ({
          likedSongs: state.likedSongs.filter(song => song._id !== songId)
        }));
      }
      
      return liked;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log("Unauthorized: User not logged in");
      } else {
        console.error("Error toggling like:", error);
      }
      return false;
    }
  },

  checkBulkLikeStatus: async (songIds: string[]) => {
    if (!songIds.length) return;
    
    try {
      const response = await axiosInstance.post("/liked-songs/check-bulk", { songIds });
      set((state) => ({
        likeStatus: { ...state.likeStatus, ...response.data }
      }));
    } catch (error: any) {
      console.error("Error checking bulk like status:", error);
    }
  },

  reset: () => {
    set({
      likedSongs: [],
      likeStatus: {},
      isLoading: false,
      error: null
    });
  }
}));
