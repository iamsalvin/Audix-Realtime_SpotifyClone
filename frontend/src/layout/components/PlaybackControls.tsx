import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import DownloadButton from "@/components/DownloadButton";
import { useEffect, useRef, useState } from "react";
import { useActivityStore } from "@/stores/useActivityStore";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { useChatStore } from "@/stores/useChatStore";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    logPlayActivity,
    setShowPremiumPopup,
    pendingPlay,
  } = usePlayerStore();
  const { fetchActivityData } = useActivityStore();
  const { premiumStatus } = usePremiumStore();
  const isPremium = premiumStatus?.isPremium || false;

  const [volume, setVolume] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to refresh activity data
  const refreshActivity = () => {
    setTimeout(() => {
      console.log("Refreshing activity data from PlaybackControls");
      fetchActivityData(true);
    }, 500);
  };

  useEffect(() => {
    audioRef.current = document.querySelector("audio");

    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    const handleEnded = () => {
      // Log the current song's play activity
      logPlayActivity();
      // Refresh activity data
      refreshActivity();
      usePlayerStore.setState({ isPlaying: false });
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong, logPlayActivity, refreshActivity]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Convert volume from 0-100 scale to 0-1 scale that audio elements use
    audio.volume = volume / 100;
  }, [volume]);

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
    }
  };

  // Handler for next button that handles premium status
  const handleNext = () => {
    // For all users, log current play first
    logPlayActivity();

    if (isPremium) {
      // For premium users, directly call playNext without checking premium status again
      const { currentIndex, queue } = usePlayerStore.getState();

      if (queue.length === 0) return;

      let nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        nextIndex = 0; // loop back to first song
      }

      const nextSong = queue[nextIndex];

      // Update socket activity
      const socket = useChatStore.getState().socket;
      if (socket?.auth) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
        });
      }

      // Directly set state for premium users
      usePlayerStore.setState({
        currentSong: nextSong,
        currentIndex: nextIndex,
        isPlaying: true,
        playStartTime: Date.now(),
      });

      // Refresh activity data
      refreshActivity();
    } else {
      // For non-premium users, show popup
      setShowPremiumPopup(true);
      refreshActivity();
    }
  };

  // Handler for previous button that handles premium status
  const handlePrevious = () => {
    // For all users, log current play first
    logPlayActivity();

    if (isPremium) {
      // For premium users, directly call playPrevious without checking premium status again
      const { currentIndex, queue } = usePlayerStore.getState();

      if (queue.length === 0) return;

      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1; // loop to last song
      }

      const prevSong = queue[prevIndex];

      // Update socket activity
      const socket = useChatStore.getState().socket;
      if (socket?.auth) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
        });
      }

      // Directly set state for premium users
      usePlayerStore.setState({
        currentSong: prevSong,
        currentIndex: prevIndex,
        isPlaying: true,
        playStartTime: Date.now(),
      });

      // Refresh activity data
      refreshActivity();
    } else {
      // For non-premium users, show popup
      setShowPremiumPopup(true);
      refreshActivity();
    }
  };

  // Handler for play/pause that ensures activity is updated
  const handleTogglePlay = () => {
    togglePlay();
    if (!isPlaying) {
      // If we're currently paused and about to play
      refreshActivity();
    }
  };

  // Determine if buttons should be disabled
  const noSongSelected = !currentSong;
  const hasPendingPlay = !!pendingPlay;

  return (
    <div className="h-[100px] bg-gradient-to-b from-zinc-900 to-black border-t border-white/5 p-4">
      <div className="flex justify-between items-center h-full max-w-[1800px] mx-auto">
        {/* currently playing song */}
        <div className="hidden sm:flex items-center gap-4 min-w-[180px] w-[30%]">
          {currentSong && (
            <>
              <img
                src={currentSong.imageUrl}
                alt={currentSong.title}
                className="w-14 h-14 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate hover:underline cursor-pointer">
                  {currentSong.title}
                </div>
                <div className="text-sm text-zinc-400 truncate hover:underline cursor-pointer">
                  {currentSong.artist}
                </div>
              </div>
            </>
          )}
        </div>

        {/* player controls - Modified for better mobile display */}
        <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1 max-w-full sm:max-w-[45%]">
          {/* Timer for mobile - visible only on small screens */}
          <div className="flex items-center gap-2 sm:hidden text-xs text-zinc-400 w-full justify-center mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Button
              size="icon"
              variant="ghost"
              className="hidden sm:inline-flex hover:text-white text-zinc-400"
            >
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="hover:text-white text-zinc-400"
              onClick={handlePrevious}
              disabled={noSongSelected || hasPendingPlay}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="bg-white hover:bg-white/80 text-black rounded-full h-8 w-8"
              onClick={handleTogglePlay}
              disabled={noSongSelected || hasPendingPlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="hover:text-white text-zinc-400"
              onClick={handleNext}
              disabled={noSongSelected || hasPendingPlay}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="hidden sm:inline-flex hover:text-white text-zinc-400"
            >
              <Repeat className="h-4 w-4" />
            </Button>

            {/* Download button for premium users */}
            {currentSong && isPremium && (
              <DownloadButton song={currentSong} className="hidden sm:flex" />
            )}
          </div>

          {/* Progress bar and timer */}
          <div className="w-full flex items-center gap-2 px-2">
            {/* Timer hidden on mobile, visible on larger screens */}
            <span className="hidden sm:inline text-xs text-zinc-400 min-w-[40px]">
              {formatTime(currentTime)}
            </span>

            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              className="w-full"
              onValueChange={handleSeek}
              disabled={hasPendingPlay}
            />

            {/* Timer hidden on mobile, visible on larger screens */}
            <span className="hidden sm:inline text-xs text-zinc-400 min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* volume control */}
        <div className="hidden sm:flex items-center gap-2 min-w-[180px] w-[30%] justify-end">
          <Volume2 className="h-5 w-5 text-zinc-400" />
          <Slider
            className="w-[120px]"
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>
    </div>
  );
};
