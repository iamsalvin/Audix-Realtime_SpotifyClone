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
  AlignLeft,
  ExternalLink,
  Music,
  Volume1,
  VolumeX,
} from "lucide-react";
import DownloadButton from "@/components/DownloadButton";
import { useEffect, useRef, useState } from "react";
import { useActivityStore } from "@/stores/useActivityStore";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { useChatStore } from "@/stores/useChatStore";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
  const { openChat } = useChatStore();

  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isVolumeChanging, setIsVolumeChanging] = useState(false);
  const lastInteractionRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to refresh activity data
  const refreshActivity = () => {
    setTimeout(() => {
      console.log("Refreshing activity data from PlaybackControls");
      fetchActivityData(true);
    }, 500);
  };

  // Debounce function for controls
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Handle button clicks with debounce
  const handlePlayPause = debounce(() => {
    const now = Date.now();
    if (now - lastInteractionRef.current < 300) return; // Prevent rapid clicks
    lastInteractionRef.current = now;

    if (!isPremium && !isPlaying) {
      openChat();
      return;
    }
    togglePlay();
  }, 200);

  const handleNext = debounce(() => {
    const now = Date.now();
    if (now - lastInteractionRef.current < 300) return;
    lastInteractionRef.current = now;

    if (!isPremium) {
      openChat();
      return;
    }
    playNext();
  }, 200);

  const handlePrevious = debounce(() => {
    const now = Date.now();
    if (now - lastInteractionRef.current < 300) return;
    lastInteractionRef.current = now;

    if (!isPremium) {
      openChat();
      return;
    }
    playPrevious();
  }, 200);

  // Audio event handlers
  useEffect(() => {
    const audio = document.querySelector("audio");
    if (!audio) return;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isSeeking && audio) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio) {
        setDuration(audio.duration);
        audio.volume = volume;
      }
    };

    const handleEnded = () => {
      logPlayActivity();
      if (isPremium) {
        playNext();
      } else {
        usePlayerStore.setState({ isPlaying: false });
        openChat();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isSeeking, volume, isPremium, logPlayActivity, playNext, openChat]);

  // Handle seeking
  const handleSeek = (value: number[]) => {
    if (!audioRef.current || !isPremium) return;

    const newTime = value[0];
    setCurrentTime(newTime);

    if (!isSeeking) {
      setIsSeeking(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        audioRef.current!.currentTime = newTime;
        setIsSeeking(false);
      }, 200);
    }
  };

  // Handle volume changes
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;

    const newVolume = value[0];
    setVolume(newVolume);

    if (!isVolumeChanging) {
      setIsVolumeChanging(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        audioRef.current!.volume = newVolume;
        setIsVolumeChanging(false);
      }, 100);
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
              <div className="relative group">
                <img
                  src={currentSong.imageUrl}
                  alt={currentSong.title}
                  className="w-14 h-14 object-cover rounded-md"
                />
                {/* Link to song details overlay on hover */}
                <Link
                  to={`/songs/${currentSong._id}`}
                  className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                >
                  <ExternalLink className="h-6 w-6 text-white" />
                </Link>
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/songs/${currentSong._id}`}
                  className="font-medium truncate hover:underline cursor-pointer"
                >
                  {currentSong.title}
                </Link>
                <div className="text-sm text-zinc-400 truncate">
                  {currentSong.artist}
                </div>
              </div>

              {/* Lyrics button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={`/songs/${currentSong._id}`}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/30 rounded-full transition-colors relative"
                    >
                      <Music className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>View lyrics</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
            {/* Mobile lyrics button */}
            {currentSong && (
              <Link
                to={`/songs/${currentSong._id}`}
                className="ml-2 text-zinc-400 hover:text-white"
              >
                <Music className="h-4 w-4" />
              </Link>
            )}
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
              onClick={handlePlayPause}
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
              className="w-full cursor-pointer"
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
          <div className="flex items-center gap-2">
            {volume === 0 ? (
              <VolumeX className="h-5 w-5 text-zinc-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="h-5 w-5 text-zinc-400" />
            ) : (
              <Volume2 className="h-5 w-5 text-zinc-400" />
            )}
            <Slider
              className="w-[120px] cursor-pointer"
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
