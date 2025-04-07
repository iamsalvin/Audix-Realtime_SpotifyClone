import { create } from "zustand";
import { Song } from "@/types";
import { useChatStore } from "./useChatStore";
import { useActivityStore } from "./useActivityStore";
import { usePremiumStore } from "./usePremiumStore";

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  playStartTime: number | null; // Track when a song started playing
  showPremiumPopup: boolean; // Whether to show the premium popup
  pendingPlay: { song: Song; index: number } | null; // Song to play after premium popup closes

  initializeQueue: (songs: Song[]) => void;
  playAlbum: (songs: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  play: (song: Song, index: number) => void;
  setQueue: (songs: Song[]) => void;
  logPlayActivity: () => void;
  setShowPremiumPopup: (show: boolean) => void;
  continuePlayAfterPopup: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentIndex: -1,
  playStartTime: null,
  showPremiumPopup: false,
  pendingPlay: null,

  initializeQueue: (songs: Song[]) => {
    set({
      queue: songs,
      currentSong: get().currentSong || songs[0],
      currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
    });
  },

  playAlbum: (songs: Song[], startIndex = 0) => {
    if (songs.length === 0) return;

    const song = songs[startIndex];

    // Force a premium status check on every play attempt
    usePremiumStore.getState().checkPremiumStatus();

    // Get the latest premium status
    const premiumStatus = usePremiumStore.getState().premiumStatus;
    const isPremium = premiumStatus?.isPremium || false;

    // IMPORTANT: Always show popup for non-premium users for ALL songs
    // This is a forced implementation to ensure the ad shows
    if (!isPremium) {
      console.log("Non-premium user attempting to play album, showing popup", {
        isPremium,
        song: song.title,
      });

      // Save the queue and pending song information
      set({
        queue: songs,
        showPremiumPopup: true,
        pendingPlay: { song, index: startIndex },
      });
      return;
    } else {
      console.log("Premium user playing album, no popup needed");
    }

    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${song.title} by ${song.artist}`,
      });
    }

    // Log previous song play if there was one
    get().logPlayActivity();

    set({
      queue: songs,
      currentSong: song,
      currentIndex: startIndex,
      isPlaying: true,
      playStartTime: Date.now(),
    });
  },

  setCurrentSong: (song: Song | null) => {
    // Skip premium check if song is null (stopping playback)
    if (!song) {
      set({
        currentSong: null,
        isPlaying: false,
        playStartTime: null,
      });
      return;
    }

    // Force a premium status check on every play attempt
    usePremiumStore.getState().checkPremiumStatus();

    // Get the latest premium status
    const premiumStatus = usePremiumStore.getState().premiumStatus;
    const isPremium = premiumStatus?.isPremium || false;

    // IMPORTANT: Always show popup for non-premium users for ALL songs
    // This is a forced implementation to ensure the ad shows
    if (!isPremium) {
      console.log(
        "Non-premium user attempting to play song via setCurrentSong, showing popup",
        { isPremium, song: song.title }
      );

      // Create a queue with just this song
      set({
        queue: [song],
        showPremiumPopup: true,
        pendingPlay: { song, index: 0 },
      });
      return;
    } else {
      console.log(
        "Premium user playing song via setCurrentSong, no popup needed"
      );
    }

    // Log previous song play if there was one
    get().logPlayActivity();

    const socket = useChatStore.getState().socket;
    if (song && socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${song.title} by ${song.artist}`,
      });
    }

    set({
      currentSong: song,
      isPlaying: true,
      playStartTime: Date.now(),
    });
  },

  togglePlay: () => {
    const isCurrentlyPlaying = get().isPlaying;
    const currentTime = Date.now();

    // If we're pausing, log the current play session
    if (isCurrentlyPlaying) {
      get().logPlayActivity();
    } else if (get().currentSong) {
      // If we're resuming, reset the play start time
      set({ playStartTime: currentTime });
    }

    set({ isPlaying: !isCurrentlyPlaying });
  },

  playNext: () => {
    const { currentIndex, queue, isPlaying } = get();

    // Log previous song play
    get().logPlayActivity();

    if (queue.length === 0) {
      set({ isPlaying: false, currentSong: null, playStartTime: null });
      return;
    }

    let nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      nextIndex = 0; // loop back to first song
    }

    const nextSong = queue[nextIndex];

    // Force a premium status check
    usePremiumStore.getState().checkPremiumStatus();

    // Get the latest premium status
    const premiumStatus = usePremiumStore.getState().premiumStatus;
    const isPremium = premiumStatus?.isPremium || false;

    // If not premium, show popup instead of playing next song
    if (!isPremium) {
      console.log(
        "Non-premium user attempting to play next song, showing popup"
      );

      set({
        showPremiumPopup: true,
        pendingPlay: { song: nextSong, index: nextIndex },
      });
      return;
    }

    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
      });
    }

    set({
      currentSong: nextSong,
      currentIndex: nextIndex,
      isPlaying: true,
      playStartTime: Date.now(),
    });
  },

  playPrevious: () => {
    const { currentIndex, queue, isPlaying } = get();

    // Log previous song play
    get().logPlayActivity();

    if (queue.length === 0) {
      set({ isPlaying: false, currentSong: null, playStartTime: null });
      return;
    }

    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      prevIndex = queue.length - 1; // loop to last song
    }

    const prevSong = queue[prevIndex];

    // Force a premium status check
    usePremiumStore.getState().checkPremiumStatus();

    // Get the latest premium status
    const premiumStatus = usePremiumStore.getState().premiumStatus;
    const isPremium = premiumStatus?.isPremium || false;

    // If not premium, show popup instead of playing next song
    if (!isPremium) {
      console.log(
        "Non-premium user attempting to play previous song, showing popup"
      );

      set({
        showPremiumPopup: true,
        pendingPlay: { song: prevSong, index: prevIndex },
      });
      return;
    }

    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
      });
    }

    set({
      currentSong: prevSong,
      currentIndex: prevIndex,
      isPlaying: true,
      playStartTime: Date.now(),
    });
  },

  // New method to set the queue
  setQueue: (songs: Song[]) => {
    set({
      queue: songs,
    });
  },

  // New method to play a specific song at a specific index
  play: (song: Song, index: number) => {
    // Force a premium status check on every play attempt
    usePremiumStore.getState().checkPremiumStatus();

    // Get the latest premium status
    const premiumStatus = usePremiumStore.getState().premiumStatus;
    const isPremium = premiumStatus?.isPremium || false;

    // IMPORTANT: Always show popup for non-premium users for ALL songs
    // This is a forced implementation to ensure the ad shows
    if (!isPremium) {
      console.log("Non-premium user attempting to play song, showing popup", {
        isPremium,
        song: song.title,
      });

      // Always show popup for ALL songs for non-premium users
      console.log("Setting showPremiumPopup to true and saving pending play");
      set({
        showPremiumPopup: true,
        pendingPlay: { song, index },
      });
      return;
    } else {
      console.log("Premium user playing song, no popup needed");
    }

    // Log previous song play
    get().logPlayActivity();

    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${song.title} by ${song.artist}`,
      });
    }

    set({
      currentSong: song,
      currentIndex: index,
      isPlaying: true,
      playStartTime: Date.now(),
    });
  },

  // Log play activity for the current song
  logPlayActivity: () => {
    const { currentSong, playStartTime, isPlaying } = get();

    // Only log if a song is currently playing and we have a start time
    if (currentSong && playStartTime && isPlaying) {
      const playDuration = Math.floor((Date.now() - playStartTime) / 1000); // Duration in seconds

      // Only log if played more than 5 seconds
      if (playDuration >= 5) {
        const activityStore = useActivityStore.getState();
        // Log the play and ensure it immediately updates the activity data
        activityStore.logSongPlay(currentSong._id, playDuration);

        // Reset play start time to track the new session
        set({ playStartTime: Date.now() });
      }
    }
  },

  // Set whether to show the premium popup
  setShowPremiumPopup: (show: boolean) => {
    set({ showPremiumPopup: show });
  },

  // Continue playing the pending song after premium popup closes
  continuePlayAfterPopup: () => {
    const { pendingPlay } = get();
    if (pendingPlay) {
      const { song, index } = pendingPlay;
      console.log("Continuing playback after popup for song:", song.title);

      // Reset pending play first
      set({ pendingPlay: null, showPremiumPopup: false });

      // Log previous play
      get().logPlayActivity();

      // Actually play the song now
      set({
        currentSong: song,
        currentIndex: index,
        isPlaying: true,
        playStartTime: Date.now(),
      });

      const socket = useChatStore.getState().socket;
      if (socket.auth) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Playing ${song.title} by ${song.artist}`,
        });
      }

      // Refresh activity after a short delay
      setTimeout(() => {
        const activityStore = useActivityStore.getState();
        activityStore.fetchActivityData(true);
      }, 500);
    } else {
      console.warn("No pending play found when continuing after popup");
    }
  },
}));
