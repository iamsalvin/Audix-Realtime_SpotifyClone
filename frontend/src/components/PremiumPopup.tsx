import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Crown, Music, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumPopupProps {
  onClose: () => void;
  autoCloseTime?: number; // Time in seconds before auto-closing
  onContinue?: () => void; // Callback when user continues without premium
}

const PremiumPopup = ({ 
  onClose, 
  autoCloseTime = 5,
  onContinue
}: PremiumPopupProps) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseTime);
  const navigate = useNavigate();
  
  // Auto-close timer - ENHANCED VERSION
  useEffect(() => {
    console.log('Premium popup mounted, starting 5-second timer');
    // Start with the full time
    setTimeLeft(autoCloseTime);
    
    // Create a timer that counts down every second
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        console.log(`Premium popup timer: ${prev} seconds remaining`);
        // When we reach 0, clear the interval and trigger the continue action
        if (prev <= 1) {
          console.log('Premium popup timer finished, auto-continuing');
          clearInterval(timer);
          // Small delay to ensure UI updates before closing
          setTimeout(() => {
            console.log('Executing onClose and onContinue callbacks');
            onClose();
            if (onContinue) onContinue();
          }, 500); // Increased delay for better reliability
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Force the popup to stay visible for at least the minimum time
    const forceVisibleTimeout = setTimeout(() => {
      console.log('Minimum display time reached');
    }, autoCloseTime * 1000);
    
    // Clean up the timer when component unmounts
    return () => {
      console.log('Premium popup unmounted, clearing timer');
      clearInterval(timer);
      clearTimeout(forceVisibleTimeout);
    };
  }, [autoCloseTime, onClose, onContinue]);
  
  const handleUpgrade = () => {
    navigate("/premium");
    onClose();
  };
  
  const handleContinue = () => {
    onClose();
    if (onContinue) onContinue();
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X size={20} />
        </button>
        
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
            <Button 
              onClick={handleUpgrade}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
            >
              Upgrade Now
            </Button>
            
            <Button 
              onClick={handleContinue}
              variant="outline" 
              className="border-zinc-700 flex-1"
            >
              Continue ({timeLeft}s)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPopup;
