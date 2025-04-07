import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import { Song } from "@/types";

export interface MoodOption {
  value: string;
  label: string;
}

interface MoodStore {
  availableMoods: MoodOption[];
  songsByMood: Record<string, Song[]>;
  isLoading: boolean;
  error: string | null;
  
  fetchAvailableMoods: () => Promise<void>;
  fetchSongsByMood: (mood?: string) => Promise<void>;
  reset: () => void;
}

export const useMoodStore = create<MoodStore>((set) => ({
  availableMoods: [],
  songsByMood: {},
  isLoading: false,
  error: null,
  
  fetchAvailableMoods: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs/moods");
      set({ availableMoods: response.data });
    } catch (error: any) {
      console.error("Error fetching moods:", error);
      set({ error: error?.response?.data?.message || "Failed to fetch moods" });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchSongsByMood: async (mood?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = mood ? `/songs/moods/${mood}` : "/songs/by-mood";
      const response = await axiosInstance.get(url);
      
      if (mood) {
        // If a specific mood was requested, update only that mood's songs
        set((state) => ({
          songsByMood: {
            ...state.songsByMood,
            [mood]: response.data
          }
        }));
      } else {
        // Otherwise update all moods
        set({ songsByMood: response.data });
      }
    } catch (error: any) {
      console.error("Error fetching songs by mood:", error);
      set({ error: error?.response?.data?.message || "Failed to fetch songs by mood" });
    } finally {
      set({ isLoading: false });
    }
  },
  
  reset: () => {
    set({
      availableMoods: [],
      songsByMood: {},
      isLoading: false,
      error: null
    });
  }
}));
