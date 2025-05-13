import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Topbar from "../../components/Topbar";
import { ScrollArea } from "../../components/ui/scroll-area";
import { usePlayerStore } from "../../stores/usePlayerStore";
import { useLikedSongsStore } from "../../stores/useLikedSongsStore";
import { usePremiumStore } from "../../stores/usePremiumStore";
import { axiosInstance } from "../../lib/axios";
import { Song } from "../../types";
import {
  ArrowLeft,
  Clock,
  Music,
  PlayCircle,
  SkipBack,
  SkipForward,
  Pause,
  Play,
  Album,
  Calendar,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import LikeButton from "../../components/LikeButton";
import { Skeleton } from "../../components/ui/skeleton";
import DownloadButton from "../../components/DownloadButton";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// For AssemblyAI SDK integration:
// 1. Install the AssemblyAI SDK: npm install assemblyai
// 2. Add to your .env file: REACT_APP_ASSEMBLYAI_API_KEY=your_api_key_here
// 3. Import the SDK at the top of this file: import { AssemblyAI } from 'assemblyai';
// 4. Uncomment the implementation in the generateLyrics function above
//
// Note: You'll also need backend support to save generated lyrics
// Example API endpoint: POST /lyrics/:songId with body { lyrics: LyricLine[] }

interface LyricLine {
  time: number;
  text: string;
}

interface SongLyrics {
  lyrics: LyricLine[];
}

const SongDetailsPage = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  const {
    currentSong,
    isPlaying,
    play,
    playNext,
    playPrevious,
    togglePlay,
  } = usePlayerStore() as any;
  const { checkBulkLikeStatus } = useLikedSongsStore();
  const { premiumStatus } = usePremiumStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add error boundary
  const [navigationError, setNavigationError] = useState(false);

  // Reset error when song ID changes
  useEffect(() => {
    if (songId) {
      setNavigationError(false);
    }
  }, [songId]);

  // Handle navigation errors
  const safeNavigate = (path: string) => {
    try {
      navigate(path, { replace: true });
    } catch (error) {
      console.error("Navigation failed:", error);
      setNavigationError(true);
      // Fallback to home page
      navigate("/");
    }
  };

  // Fetch song details
  useEffect(() => {
    const fetchSongDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/songs/${songId}`);
        setSong(response.data);
        if (response.data._id) {
          checkBulkLikeStatus([response.data._id]);
        }
      } catch (error) {
        console.error("Failed to fetch song details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (songId) {
      fetchSongDetails();
    }
  }, [songId, checkBulkLikeStatus]);

  // Fetch lyrics
  useEffect(() => {
    const fetchLyrics = async () => {
      if (!songId || !song) return;

      setLyricsLoading(true);
      try {
        const response = await axiosInstance.get<{ lyrics: LyricLine[] }>(
          `/lyrics/${songId}`
        );

        if (
          response.data &&
          response.data.lyrics &&
          Array.isArray(response.data.lyrics) &&
          response.data.lyrics.length > 0
        ) {
          console.log("Found existing lyrics");
          setLyrics(response.data.lyrics);
        } else {
          console.log("No lyrics found, attempting to generate");
          // If no lyrics found, try to generate them
          setLyrics([{ time: 0, text: "Generating lyrics..." }]);

          // Generate lyrics using AssemblyAI
          const generatedLyrics = await generateLyrics(song.audioUrl);

          if (generatedLyrics && generatedLyrics.length > 0) {
            console.log("Successfully generated lyrics");
            setLyrics(generatedLyrics);

            // Optionally save the generated lyrics to the server
            try {
              await axiosInstance.post(`/lyrics/${songId}`, {
                lyrics: generatedLyrics,
              });
              console.log("Saved generated lyrics");
            } catch (saveError) {
              console.error("Failed to save generated lyrics:", saveError);
            }
          } else {
            console.log("Failed to generate lyrics");
            setLyrics([{ time: 0, text: "No lyrics available for this song" }]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch lyrics:", error);
        setLyrics([{ time: 0, text: "No lyrics available for this song" }]);
      } finally {
        setLyricsLoading(false);
      }
    };

    if (songId && song) {
      fetchLyrics();
    }
  }, [songId, song]);

  // Get access to the audio element for playback tracking
  useEffect(() => {
    audioRef.current = document.querySelector("audio");

    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", updateTime);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
    };
  }, []);

  // Update active lyric based on current time
  useEffect(() => {
    if (!lyrics.length) return;

    let activeIndex = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        activeIndex = i;
        break;
      }
    }

    if (activeIndex !== activeLyricIndex) {
      setActiveLyricIndex(activeIndex);

      // For better centering, use a gentler scroll effect
      if (activeLyricRef.current && isPlaying) {
        activeLyricRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentTime, lyrics, activeLyricIndex, isPlaying]);

  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  // Function to convert AssemblyAI word timestamps to LyricLine format
  const convertToLyricLines = (words: any[]): LyricLine[] => {
    if (!words || words.length === 0) return [];

    // Group words into lines
    const lines: LyricLine[] = [];
    let currentLine = { time: words[0].start / 1000, text: "" };
    let wordCount = 0;

    words.forEach((word) => {
      currentLine.text += (currentLine.text ? " " : "") + word.text;
      wordCount++;

      // Create a new line every few words or at punctuation
      if (wordCount >= 5 || word.text.match(/[.?!,;:]$/)) {
        lines.push({ ...currentLine });
        // Start next line with the timestamp of the next word
        const nextIndex = words.indexOf(word) + 1;
        currentLine = {
          time:
            nextIndex < words.length
              ? words[nextIndex].start / 1000
              : word.end / 1000,
          text: "",
        };
        wordCount = 0;
      }
    });

    // Add the last line if not empty
    if (currentLine.text) lines.push(currentLine);

    return lines;
  };

  // Function to generate lyrics using AssemblyAI - to be implemented with the SDK
  const generateLyrics = async (
    audioUrl: string
  ): Promise<LyricLine[] | null> => {
    // Create mock lyrics for demonstration purposes
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate mock lyrics with timestamps
      const mockLyrics: LyricLine[] = [
        { time: 0, text: "[Intro]" },
        { time: 2, text: "The sun sets over the horizon" },
        { time: 6, text: "As I watch the day fade away" },
        { time: 10, text: "Memories of you still linger" },
        { time: 14, text: "In the spaces between heartbeats" },
        { time: 18, text: "[Verse 1]" },
        { time: 22, text: "Time keeps moving forward" },
        { time: 26, text: "But my thoughts remain with you" },
        { time: 30, text: "The city lights illuminate" },
        { time: 34, text: "Shadows of what used to be" },
        { time: 38, text: "Every street corner reminds me" },
        { time: 42, text: "Of promises we couldn't keep" },
        { time: 46, text: "[Chorus]" },
        { time: 50, text: "And I would climb mountains" },
        { time: 54, text: "Just to see your smile again" },
        { time: 58, text: "I would cross oceans" },
        { time: 62, text: "To hear you say my name" },
        { time: 66, text: "But the distance between us" },
        { time: 70, text: "Isn't measured in miles" },
        { time: 74, text: "It's the silence that divides" },
        { time: 78, text: "[Verse 2]" },
        { time: 82, text: "Seasons change without warning" },
        { time: 86, text: "Leaves fall like forgotten words" },
        { time: 90, text: "I gather them in my memory" },
        { time: 94, text: "Trying to piece us back together" },
        { time: 98, text: "But some puzzles aren't meant to be solved" },
        { time: 102, text: "Some stories have no ending" },
      ];

      // Return the mock lyrics
      console.log("Generated mock lyrics:", mockLyrics.length, "lines");
      return mockLyrics;
    } catch (error) {
      console.error("Error generating mock lyrics:", error);
      return null;
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!song) return;

    if (currentSong?._id === song._id) {
      // If this is the current song, just toggle play/pause state
      togglePlay();
    } else {
      // If this is a new song, set it as the current song and play it
      // Find the song index in the queue or add it if not present
      const existingIndex = usePlayerStore
        .getState()
        .queue.findIndex((s) => s._id === song._id);

      if (existingIndex >= 0) {
        // If song is in queue, play at that index
        play(song, existingIndex);
      } else {
        // If song is not in queue, create a new queue with just this song
        const newQueue = [song, ...usePlayerStore.getState().queue];
        usePlayerStore.getState().setQueue(newQueue);
        play(song, 0);
      }
    }
  };

  // Handle next song
  const handleNext = () => {
    try {
      // Store the current song ID before calling playNext
      const currentSongId = currentSong?._id;
      
      // Call playNext directly from the store
      playNext();
      
      // Check if the user is premium
      const isPremium = premiumStatus?.isPremium;
      
      // Only navigate if the user is premium or the popup isn't showing
      if (isPremium) {
        // For premium users, wait for the next song to be set before navigating
        setTimeout(() => {
          const nextSong = usePlayerStore.getState().currentSong;
          // Only navigate if the song has actually changed and is valid
          if (nextSong && nextSong._id && nextSong._id !== currentSongId) {
            safeNavigate(`/songs/${nextSong._id}`);
          }
        }, 50);  // Shorter delay for better responsiveness
      }
      // For non-premium users, don't navigate - let the premium popup handle it
    } catch (error) {
      console.error("Error playing next song:", error);
    }
  };

  // Handle previous song
  const handlePrevious = () => {
    try {
      // Store the current song ID before calling playPrevious
      const currentSongId = currentSong?._id;
      
      // Call playPrevious directly from the store
      playPrevious();
      
      // Check if the user is premium
      const isPremium = premiumStatus?.isPremium;
      
      // Only navigate if the user is premium or the popup isn't showing
      if (isPremium) {
        // For premium users, wait for the previous song to be set before navigating
        setTimeout(() => {
          const prevSong = usePlayerStore.getState().currentSong;
          // Only navigate if the song has actually changed and is valid
          if (prevSong && prevSong._id && prevSong._id !== currentSongId) {
            safeNavigate(`/songs/${prevSong._id}`);
          }
        }, 50);  // Shorter delay for better responsiveness
      }
      // For non-premium users, don't navigate - let the premium popup handle it
    } catch (error) {
      console.error("Error playing previous song:", error);
    }
  };

  // Update the page when the current song changes in the player
  useEffect(() => {
    if (currentSong && currentSong._id && currentSong._id !== songId) {
      safeNavigate(`/songs/${currentSong._id}`);
    }
  }, [currentSong, songId]);

  // Go back to previous page
  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
        <Topbar />
        <div className="h-[calc(100vh-180px)] overflow-hidden">
          <div className="p-6">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-6 hover:bg-zinc-700/30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="aspect-square h-64 w-64 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-8 w-2/3 mb-2" />
                <Skeleton className="h-6 w-1/2 mb-6" />
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-8" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-24 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!song) {
    return (
      <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
        <Topbar />
        <div className="h-[calc(100vh-180px)] overflow-hidden">
          <div className="p-6 text-center">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-6 hover:bg-zinc-700/30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="py-20">
              <Music className="h-20 w-20 mx-auto mb-4 text-zinc-600" />
              <h2 className="text-2xl font-bold mb-2">Song not found</h2>
              <p className="text-zinc-400">
                The song you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isCurrentlyPlaying = currentSong?._id === song._id && isPlaying;

  // Determine if the current lyric is a section header (like [Chorus], [Verse], etc.)
  const isSectionHeader = (text: string) => {
    return text.startsWith("[") && text.endsWith("]");
  };

  // Function to render a lyric line with proper styling
  const renderLyricLine = (line: LyricLine, index: number) => {
    const isActive = index === activeLyricIndex;
    const isPast = index < activeLyricIndex;
    const isVeryClose =
      index === activeLyricIndex - 1 || index === activeLyricIndex + 1;
    const isClose =
      index === activeLyricIndex - 2 || index === activeLyricIndex + 2;
    const isHeader = isSectionHeader(line.text);

    // Calculate the relative position to active lyric
    const relativePosition = index - activeLyricIndex;

    // Vertical offset based on position relative to active line
    const verticalOffset = Math.abs(relativePosition) * 20;

    // If it's a past line and not a header, reduce the opacity significantly
    const lineOpacity =
      isPast && !isHeader
        ? isVeryClose
          ? 0.4
          : 0.15
        : isActive
        ? 1
        : isVeryClose
        ? 0.8
        : isClose
        ? 0.5
        : 0.3;

    return (
      <motion.div
        key={`${index}-${line.time}`}
        data-index={index}
        ref={isActive ? activeLyricRef : null}
        initial={{ opacity: 0, y: relativePosition < 0 ? -25 : 25 }}
        animate={{
          opacity: lineOpacity,
          y: isActive
            ? 0
            : relativePosition < 0
            ? -verticalOffset
            : verticalOffset,
          x: 0,
          scale: isActive ? 1 : 1 - Math.abs(relativePosition) * 0.05,
        }}
        exit={{
          opacity: 0,
          y: isPast ? -40 : 40,
          transition: { duration: 0.3 },
        }}
        transition={{
          duration: 0.4,
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
        className={cn(
          "py-2 my-1 transition-all duration-300 mx-auto w-full max-w-2xl text-center relative",
          isHeader &&
            "text-emerald-400 font-bold mt-4 mb-3 tracking-wider px-2 py-1",
          !isHeader && isPast && "text-zinc-400",
          !isHeader && !isPast && !isActive && "text-zinc-500"
        )}
      >
        {isHeader ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 70%)",
            }}
          />
        ) : null}

        {isActive && !isHeader ? (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 -z-10 opacity-70"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
                backdropFilter: "blur(0.5px)",
              }}
            />
            <motion.div
              className="absolute inset-0 -z-20 opacity-50"
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              style={{
                background:
                  "radial-gradient(circle at center, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[2px] -z-30 blur-sm opacity-30"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)",
              }}
              animate={{
                width: ["120%", "150%", "120%"],
                opacity: [0.15, 0.35, 0.15],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          </>
        ) : null}

        <motion.span
          className={cn(
            "relative z-10 px-4 py-0.5 transition-all duration-300 inline-block",
            isActive &&
              !isHeader &&
              "text-white font-semibold text-2xl md:text-3xl tracking-wide",
            isVeryClose && !isHeader && "text-xl text-zinc-100 font-medium",
            !isActive && !isVeryClose && !isHeader && "text-base",
            isHeader && "uppercase text-sm tracking-widest"
          )}
          animate={
            isActive && !isHeader
              ? {
                  scale: 1.05,
                  filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))",
                }
              : isVeryClose && !isHeader
              ? { scale: 1.02 }
              : { scale: 1 }
          }
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {line.text}
          {isActive && !isHeader && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
              animate={{
                x: ["300%", "-300%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
                delay: 0.2,
              }}
            />
          )}
        </motion.span>
      </motion.div>
    );
  };

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <div className="h-[calc(100vh-180px)] overflow-hidden">
        <div className="p-4 pb-6">
          <Button
            variant="ghost"
            onClick={goBack}
            className="mb-3 hover:bg-zinc-700/30 h-8 px-2 text-sm"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row gap-6 mb-5">
            {/* Song Image */}
            <div className="relative group">
              <img
                src={song.imageUrl}
                alt={song.title}
                className="aspect-square h-48 w-48 md:h-60 md:w-60 lg:h-64 lg:w-64 object-cover rounded-md shadow-xl"
              />
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PlayCircle
                  className={`h-20 w-20 ${
                    isCurrentlyPlaying ? "text-emerald-500" : "text-white"
                  }`}
                  fill={isCurrentlyPlaying ? "rgb(16 185 129)" : "transparent"}
                />
              </button>
            </div>

            {/* Song Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {song.title}
              </h1>
              <h2 className="text-lg md:text-xl text-zinc-300 mb-4">
                {song.artist}
              </h2>

              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center text-zinc-400">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{formatDuration(song.duration)}</span>
                </div>
                <div className="flex items-center text-zinc-400 text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Added {new Date(song.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {isCurrentlyPlaying && (
                  <div className="text-emerald-500 text-sm font-medium flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                    Currently Playing
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Playback controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-10"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>

                  <Button
                    onClick={handlePlayPause}
                    variant="default"
                    className="rounded-full w-12 h-12 bg-white text-black hover:bg-zinc-200 flex items-center justify-center p-0"
                  >
                    {isCurrentlyPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-10"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex gap-1 ml-2">
                  <div className="h-9 w-9 flex items-center justify-center">
                    <LikeButton songId={song._id} size="md" showBackground />
                  </div>
                  <div className="h-9 w-9 flex items-center justify-center">
                    <DownloadButton song={song} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lyrics Section */}
          <div className="mt-4 max-w-3xl mx-auto">
            {lyricsLoading ? (
              <div className="space-y-4 max-w-xl mx-auto">
                <Skeleton className="h-4 w-full bg-zinc-800/30" />
                <Skeleton className="h-4 w-5/6 mx-auto bg-zinc-800/30" />
                <Skeleton className="h-4 w-4/6 mx-auto bg-zinc-800/30" />
              </div>
            ) : (
              <motion.div
                ref={lyricsRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="whitespace-pre-line text-zinc-300 leading-relaxed p-4 pb-8 text-center h-[300px] sm:h-[340px] md:h-[360px] flex flex-col overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center pt-2 pb-3 bg-gradient-to-b from-zinc-900/40 to-transparent">
                  <motion.h3
                    className="text-base font-semibold bg-gradient-to-r from-emerald-300 via-zinc-100 to-emerald-300 bg-clip-text text-transparent inline-block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    Lyrics
                    <motion.span
                      className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    ></motion.span>
                  </motion.h3>
                  {currentSong?._id === song._id && (
                    <motion.div
                      className="text-xs text-zinc-400 flex items-center mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {formatDuration(currentTime)} /{" "}
                      {formatDuration(song.duration)}
                    </motion.div>
                  )}
                </div>

                {lyrics.length > 0 ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="mt-16 flex-1 flex items-center justify-center">
                      <div
                        className="w-full flex flex-col items-center justify-center"
                        style={{ paddingBottom: "20px" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/20 to-transparent pointer-events-none z-10 h-8 top-auto opacity-40"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/5 to-transparent pointer-events-none z-10 h-32 top-[50%] bottom-auto opacity-20"></div>
                        <div
                          className="flex flex-col items-center justify-center w-full relative"
                          style={{ minHeight: "200px" }}
                        >
                          {/* Center line indicator */}
                          <div className="absolute left-0 right-0 h-[1px] top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"></div>

                          <AnimatePresence mode="popLayout">
                            {lyrics
                              .filter(
                                (line, i) =>
                                  i === activeLyricIndex ||
                                  i === activeLyricIndex - 1 ||
                                  i === activeLyricIndex + 1 ||
                                  i === activeLyricIndex + 2 ||
                                  (i > activeLyricIndex - 5 &&
                                    i < activeLyricIndex + 5 &&
                                    isSectionHeader(line.text))
                              )
                              .map((line, index) => {
                                // Find the original index in the lyrics array
                                const originalIndex = lyrics.findIndex(
                                  (l) => l === line
                                );
                                return renderLyricLine(line, originalIndex);
                              })}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 pt-16 h-full flex flex-col items-center justify-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        animate={{
                          y: [0, -5, 0],
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                        }}
                      >
                        <Music className="h-16 w-16 mx-auto mb-4 text-zinc-500 opacity-70" />
                      </motion.div>
                      <motion.p
                        className="text-zinc-400 text-xl"
                        animate={{
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      >
                        No lyrics available for this song
                      </motion.p>

                      {/* Generate Lyrics Button */}
                      <div className="mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                          onClick={async () => {
                            if (!song) return;

                            setLyrics([
                              { time: 0, text: "Generating lyrics..." },
                            ]);
                            setLyricsLoading(true);

                            try {
                              const generatedLyrics = await generateLyrics(
                                song.audioUrl
                              );

                              if (
                                generatedLyrics &&
                                generatedLyrics.length > 0
                              ) {
                                setLyrics(generatedLyrics);

                                // Save the generated lyrics
                                try {
                                  await axiosInstance.post(
                                    `/lyrics/${songId}`,
                                    {
                                      lyrics: generatedLyrics,
                                    }
                                  );
                                } catch (error) {
                                  console.error(
                                    "Failed to save lyrics:",
                                    error
                                  );
                                }
                              } else {
                                setLyrics([
                                  {
                                    time: 0,
                                    text: "Failed to generate lyrics",
                                  },
                                ]);
                              }
                            } catch (error) {
                              console.error("Error generating lyrics:", error);
                              setLyrics([
                                { time: 0, text: "Error generating lyrics" },
                              ]);
                            } finally {
                              setLyricsLoading(false);
                            }
                          }}
                          disabled={lyricsLoading}
                        >
                          {lyricsLoading ? (
                            <>Generating...</>
                          ) : (
                            <>Generate with AI</>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SongDetailsPage;
