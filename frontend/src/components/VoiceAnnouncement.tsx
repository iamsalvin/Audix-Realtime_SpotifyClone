import { useEffect, useRef, useState } from "react";

interface VoiceAnnouncementProps {
  text: string; // Text to be announced
  duration?: number; // Duration in milliseconds
  audioUrl?: string; // URL to the custom audio file
  onEnd?: () => void; // Callback for when announcement ends
}

/**
 * Component for playing audio announcements in the app.
 * Currently uses a provided audio file instead of text-to-speech.
 */
const VoiceAnnouncement = ({
  duration = 5000,
  audioUrl = "/audio/Voice for Audix.mp3", // Default audio file path
  onEnd,
}: VoiceAnnouncementProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(audioUrl);

    // Set volume
    audioRef.current.volume = 1.0;

    // Add event listeners
    const handlePlay = () => {
      console.log("Audio started playing");
    };

    const handleEnded = () => {
      console.log("Audio finished playing");
      if (onEnd) onEnd();
    };

    const handleError = (e: Event) => {
      console.error("Error playing audio:", e);
      setError("Failed to play audio file");
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("play", handlePlay);
      audioRef.current.addEventListener("ended", handleEnded);
      audioRef.current.addEventListener("error", handleError);
    }

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
        if (onEnd) onEnd();
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
        audioRef.current.removeEventListener("play", handlePlay);
        audioRef.current.removeEventListener("ended", handleEnded);
        audioRef.current.removeEventListener("error", handleError);
      }
    };
  }, [audioUrl, duration, onEnd]);

  // For debugging purposes
  if (error) {
    console.error("VoiceAnnouncement error:", error);
  }

  return null;
};

export default VoiceAnnouncement;
