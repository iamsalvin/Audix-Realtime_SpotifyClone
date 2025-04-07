import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";
import { useActivityStore } from "@/stores/useActivityStore";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);

  const { currentSong, isPlaying, playNext, logPlayActivity } =
    usePlayerStore();
  const { fetchActivityData } = useActivityStore();

  // handle play/pause logic
  useEffect(() => {
    if (isPlaying) audioRef.current?.play();
    else audioRef.current?.pause();
  }, [isPlaying]);

  // handle song ends
  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      // Log the activity for the song that just ended
      logPlayActivity();

      // Force refresh activity data to show the new play
      setTimeout(() => {
        fetchActivityData(true);
      }, 500);

      // Play the next song
      playNext();
    };

    audio?.addEventListener("ended", handleEnded);

    return () => audio?.removeEventListener("ended", handleEnded);
  }, [playNext, logPlayActivity, fetchActivityData]);

  // handle song changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;

    // check if this is actually a new song
    const isSongChange = prevSongRef.current !== currentSong?.audioUrl;
    if (isSongChange) {
      audio.src = currentSong?.audioUrl;
      // reset the playback position
      audio.currentTime = 0;

      prevSongRef.current = currentSong?.audioUrl;

      if (isPlaying) audio.play();
    }
  }, [currentSong, isPlaying]);

  return <audio ref={audioRef} />;
};
export default AudioPlayer;
