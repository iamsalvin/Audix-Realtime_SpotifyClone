import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";
import { useActivityStore } from "@/stores/useActivityStore";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);
  const playAttemptRef = useRef<number>(0);

  const { currentSong, isPlaying, playNext, logPlayActivity } =
    usePlayerStore();
  const { fetchActivityData } = useActivityStore();

  // handle play/pause logic with retry mechanism
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = async () => {
      try {
        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log("Playback started successfully");
            playAttemptRef.current = 0; // Reset attempt counter on success
          }
        } else {
          audio.pause();
        }
      } catch (error) {
        console.error("Playback error:", error);
        // Retry play up to 3 times with increasing delays
        if (playAttemptRef.current < 3) {
          playAttemptRef.current++;
          const delay = playAttemptRef.current * 1000; // Increasing delay: 1s, 2s, 3s
          console.log(
            `Retrying playback in ${delay}ms (attempt ${playAttemptRef.current})`
          );
          setTimeout(() => {
            if (isPlaying) audio.play();
          }, delay);
        }
      }
    };

    handlePlay();
  }, [isPlaying]);

  // handle song ends with error handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      try {
        // Log the activity for the song that just ended
        logPlayActivity();

        // Force refresh activity data to show the new play
        setTimeout(() => {
          fetchActivityData(true);
        }, 500);

        // Play the next song
        playNext();
      } catch (error) {
        console.error("Error handling song end:", error);
      }
    };

    const handleError = (e: ErrorEvent) => {
      console.error("Audio playback error:", e);
      // If there's a playback error, try to recover by playing the next song
      if (isPlaying) {
        console.log("Attempting to recover by playing next song");
        playNext();
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [playNext, logPlayActivity, fetchActivityData, isPlaying]);

  // handle song changes with error recovery
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;

    const loadAndPlaySong = async () => {
      try {
        // check if this is actually a new song
        const isSongChange = prevSongRef.current !== currentSong?.audioUrl;
        if (isSongChange) {
          audio.src = currentSong?.audioUrl;
          // reset the playback position
          audio.currentTime = 0;
          prevSongRef.current = currentSong?.audioUrl;

          if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              await playPromise;
              console.log("New song started playing successfully");
            }
          }
        }
      } catch (error) {
        console.error("Error loading or playing new song:", error);
        // If there's an error loading the song, try to play the next one
        if (isPlaying) {
          console.log("Attempting to recover by playing next song");
          playNext();
        }
      }
    };

    loadAndPlaySong();
  }, [currentSong, isPlaying, playNext]);

  return <audio ref={audioRef} preload="auto" />;
};

export default AudioPlayer;
