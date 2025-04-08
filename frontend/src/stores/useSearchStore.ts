import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { Song } from "@/types";
import toast from "react-hot-toast";

interface SearchStore {
  query: string;
  results: Song[];
  isLoading: boolean;
  error: string | null;

  setQuery: (query: string) => void;
  searchSongs: () => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: "",
  results: [],
  isLoading: false,
  error: null,

  setQuery: (query) => set({ query }),

  searchSongs: async () => {
    const { query } = get();

    if (!query.trim()) {
      return set({ results: [], error: null });
    }

    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(
        `/songs/search?q=${encodeURIComponent(query)}`
      );
      set({ results: response.data });
    } catch (error: any) {
      console.error("Error searching songs:", error);
      set({ error: error.response?.data?.message || "Failed to search songs" });
      toast.error("Failed to search songs");
    } finally {
      set({ isLoading: false });
    }
  },

  clearResults: () => set({ results: [], query: "", error: null }),
}));
