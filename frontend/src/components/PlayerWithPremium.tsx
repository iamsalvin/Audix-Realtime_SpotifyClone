import { useEffect, useState, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePremiumStore } from "@/stores/usePremiumStore";
import AudioPlayer from "@/layout/components/AudioPlayer";
import PremiumPopup from "@/components/PremiumPopup";

const PlayerWithPremium = () => {
  const { showPremiumPopup, setShowPremiumPopup, continuePlayAfterPopup } =
    usePlayerStore();
  const { checkPremiumStatus, premiumStatus } = usePremiumStore();
  const [popupVisible, setPopupVisible] = useState(false);

  // Check premium status when component mounts and periodically
  useEffect(() => {
    console.log("PlayerWithPremium mounted, checking premium status");
    // Force check premium status
    checkPremiumStatus();

    // Set up interval to periodically check premium status
    const premiumCheckInterval = setInterval(() => {
      console.log("Periodic premium status check from PlayerWithPremium");
      checkPremiumStatus();
    }, 15000); // Check every 15 seconds

    return () => clearInterval(premiumCheckInterval);
  }, [checkPremiumStatus]);

  // Update popup visibility based on player store state
  useEffect(() => {
    console.log(
      "Premium popup state changed:",
      showPremiumPopup,
      "Premium status:",
      premiumStatus
    );

    // Always show popup for non-premium users when showPremiumPopup is true
    if (premiumStatus?.isPremium) {
      console.log("User is premium, hiding popup");
      setPopupVisible(false);
    } else {
      // If user is not premium, respect the showPremiumPopup state
      console.log(
        "User is not premium, setting popup visibility to:",
        showPremiumPopup
      );
      setPopupVisible(showPremiumPopup);
    }
  }, [showPremiumPopup, premiumStatus]);

  // Debug log when popup visibility changes
  useEffect(() => {
    console.log("Popup visible state:", popupVisible);
  }, [popupVisible]);

  // Handle closing the premium popup
  const handleClosePremium = useCallback(() => {
    console.log("Closing premium popup");
    setShowPremiumPopup(false);
  }, [setShowPremiumPopup]);

  // Handle continuing playback after popup closes
  const handleContinue = useCallback(() => {
    console.log("Continuing playback after popup");
    setShowPremiumPopup(false); // Ensure popup is closed
    continuePlayAfterPopup(); // Continue with the pending playback
  }, [continuePlayAfterPopup, setShowPremiumPopup]);

  return (
    <>
      <AudioPlayer />

      {/* Premium popup that shows for non-premium users */}
      {popupVisible && (
        <PremiumPopup
          onClose={handleClosePremium}
          onContinue={handleContinue}
          autoCloseTime={5}
        />
      )}
    </>
  );
};

export default PlayerWithPremium;
