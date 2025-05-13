import { useEffect, useState, useRef } from "react";
import { DebouncedButton } from "@/components/ui/debounced-button";
import { X, Crown, Music, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VoiceAnnouncement from "./VoiceAnnouncement";
import { usePlayerStore } from "@/stores/usePlayerStore";

interface PremiumPopupProps {
  onClose: () => void;
  autoCloseTime?: number; // Time in seconds before auto-closing
  onContinue?: () => void; // Callback when user continues without premium
}

const PremiumPopup = ({
  onClose,
  autoCloseTime = 5,
  onContinue,
}: PremiumPopupProps) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseTime);
  const [showVoiceAnnouncement, setShowVoiceAnnouncement] = useState(true);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const navigate = useNavigate();
  const wasPlayingRef = useRef(false);
  const musicResumedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isClosingRef = useRef(false);

  // Get player store functions for controlling playback
  const { isPlaying, togglePlay } = usePlayerStore();

  // Pause music when component mounts
  useEffect(() => {
    // Save current playback state
    wasPlayingRef.current = isPlaying;

    // Pause music if it's currently playing
    if (isPlaying) {
      console.log("Pausing music for premium popup");
      togglePlay();
    }

    // Cleanup function to resume music when component unmounts
    return () => {
      if (
        wasPlayingRef.current &&
        !musicResumedRef.current &&
        !isClosingRef.current
      ) {
        console.log("Resuming music after popup closes (cleanup)");
        togglePlay();
      }
    };
  }, []);

  // Auto-close timer - ENHANCED VERSION
  useEffect(() => {
    console.log("Premium popup mounted, starting timer");
    // Start with the full time
    setTimeLeft(autoCloseTime);

    // Create a timer that counts down every second
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        console.log(`Premium popup timer: ${prev} seconds remaining`);
        // When we reach 0, clear the interval and trigger the continue action
        if (prev <= 1) {
          console.log("Premium popup timer finished, auto-continuing");
          if (timerRef.current) clearInterval(timerRef.current);
          // Small delay to ensure UI updates before closing
          setTimeout(() => {
            console.log("Executing onClose and onContinue callbacks");
            isClosingRef.current = true;
            onClose();
            if (onContinue) onContinue();
          }, 500); // Increased delay for better reliability
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set a timer to stop the voice announcement after 5 seconds
    voiceTimerRef.current = setTimeout(() => {
      console.log("Voice announcement timer finished, hiding announcement");
      setShowVoiceAnnouncement(false);

      // Resume music after voice announcement ends if it was playing before
      if (
        wasPlayingRef.current &&
        !musicResumedRef.current &&
        !isClosingRef.current
      ) {
        console.log("Resuming music after voice announcement");
        musicResumedRef.current = true;
        togglePlay();
      }
    }, 5000);

    // Force the popup to stay visible for at least the minimum time
    const forceVisibleTimeout = setTimeout(() => {
      console.log("Minimum display time reached");
    }, autoCloseTime * 1000);

    // Clean up the timer when component unmounts
    return () => {
      console.log("Premium popup unmounted, clearing timer");
      if (timerRef.current) clearInterval(timerRef.current);
      if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
      clearTimeout(forceVisibleTimeout);
    };
  }, [autoCloseTime, onClose, onContinue, togglePlay]);

  const handleUpgrade = () => {
    // Prevent multiple clicks
    if (isActionInProgress) return;
    setIsActionInProgress(true);

    console.log("Upgrade button clicked");

    // Set closing flag to prevent music from resuming in cleanup
    isClosingRef.current = true;

    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);

    // Resume music if it was playing before
    if (wasPlayingRef.current && !musicResumedRef.current) {
      console.log("Resuming music after upgrade button clicked");
      musicResumedRef.current = true;
      togglePlay();
    }

    // Navigate to premium page and close popup
    navigate("/premium");
    onClose();
  };

  const handleContinue = () => {
    // Prevent multiple clicks
    if (isActionInProgress) return;
    setIsActionInProgress(true);

    console.log("Continue button clicked");

    // Set closing flag to prevent music from resuming in cleanup
    isClosingRef.current = true;

    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);

    // Resume music if it was playing before
    if (wasPlayingRef.current && !musicResumedRef.current) {
      console.log("Resuming music after continue button clicked");
      musicResumedRef.current = true;
      togglePlay();
    }

    // Close popup and call onContinue callback
    onClose();
    if (onContinue) onContinue();
  };

  const handleClose = () => {
    // Prevent multiple clicks
    if (isActionInProgress) return;
    setIsActionInProgress(true);

    console.log("Close button clicked");

    // Set closing flag to prevent music from resuming in cleanup
    isClosingRef.current = true;

    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);

    // Resume music if it was playing before
    if (wasPlayingRef.current && !musicResumedRef.current) {
      console.log("Resuming music after close button clicked");
      musicResumedRef.current = true;
      togglePlay();
    }

    // Close popup
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {showVoiceAnnouncement && (
        <VoiceAnnouncement
          text="Welcome to Audix Premium! Experience uninterrupted music streaming with unlimited skips and ad-free listening. Upgrade now to unlock the full potential of your music journey."
          duration={5000}
          audioUrl="/Voice Announcement/Voice for Audix.mp3"
        />
      )}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 relative">
        <DebouncedButton
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          debounceDelay={300}
          disabled={isActionInProgress}
        >
          <X size={20} />
        </DebouncedButton>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-300 p-3 rounded-full mb-4">
            <Crown className="h-8 w-8 text-black" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Upgrade to Audix Premium</h2>
          <p className="text-zinc-400 mb-4">
            Enjoy uninterrupted music with no ads and unlimited skips.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
            <div className="bg-zinc-800 p-3 rounded-lg flex items-center">
              <Volume2 className="h-5 w-5 text-emerald-500 mr-3" />
              <span className="text-sm">Ad-free listening</span>
            </div>
            <div className="bg-zinc-800 p-3 rounded-lg flex items-center">
              <Music className="h-5 w-5 text-emerald-500 mr-3" />
              <span className="text-sm">Unlimited skips</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <DebouncedButton
              onClickDebounced={handleUpgrade}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
              debounceDelay={400}
              threshold={500}
              disabled={isActionInProgress}
            >
              Upgrade Now
            </DebouncedButton>

            <DebouncedButton
              onClickDebounced={handleContinue}
              variant="outline"
              className="border-zinc-700 flex-1"
              debounceDelay={400}
              threshold={500}
              disabled={isActionInProgress}
            >
              Continue ({timeLeft}s)
            </DebouncedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPopup;
