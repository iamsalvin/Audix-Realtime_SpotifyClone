import { useEffect, useRef, useState } from "react";

interface VoiceAnnouncementProps {
  text: string;
  duration?: number; // Duration in milliseconds
  audioUrl?: string; // URL to the custom audio file
}

const VoiceAnnouncement = ({
  text,
  duration = 5000,
  audioUrl = "/audio/Voice for Audix.mp3", // Default audio file path
}: VoiceAnnouncementProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(audioUrl);

    // Set volume
    audioRef.current.volume = 1.0;

    // Add event listeners
    audioRef.current.addEventListener("play", () => {
      console.log("Audio started playing");
      setIsPlaying(true);
    });

    audioRef.current.addEventListener("ended", () => {
      console.log("Audio finished playing");
      setIsPlaying(false);
    });

    audioRef.current.addEventListener("error", (e) => {
      console.error("Error playing audio:", e);
      setError("Failed to play audio file");
    });

    // Play the audio
    audioRef.current.play().catch((error) => {
      console.error("Error playing audio:", error);
      setError("Failed to play audio file");
    });

    // Set a timeout to stop the audio after the specified duration
    timeoutRef.current = window.setTimeout(() => {
      if (audioRef.current) {
        console.log("Stopping audio after duration timeout");
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }, duration);

    // Clean up when component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeEventListener("play", () => {});
        audioRef.current.removeEventListener("ended", () => {});
        audioRef.current.removeEventListener("error", () => {});
      }
    };
  }, [audioUrl, duration]);

  // For debugging purposes
  if (error) {
    console.error("VoiceAnnouncement error:", error);
  }

  return null;
};

export default VoiceAnnouncement;
