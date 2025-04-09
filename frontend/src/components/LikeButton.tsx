import { useLikedSongsStore } from "@/stores/useLikedSongsStore";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import { useDebounceClick } from "@/hooks/useDebounceClick";

interface LikeButtonProps {
  songId: string;
  size?: "sm" | "md" | "lg";
  showBackground?: boolean;
  className?: string;
}

const LikeButton = ({
  songId,
  size = "md",
  showBackground = false,
  className,
}: LikeButtonProps) => {
  const { isSignedIn, getToken } = useAuth();
  const { likeStatus, toggleLike } = useLikedSongsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [localLiked, setLocalLiked] = useState(false); // Local state for immediate UI feedback

  const isLiked = likeStatus[songId] || localLiked || false;

  // Check like status when component mounts or songId changes
  useEffect(() => {
    const checkSingleSongLikeStatus = async () => {
      if (!isSignedIn || !songId) return;

      try {
        // Ensure token is fresh
        const token = await getToken();
        if (token) {
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;
        }

        const response = await axiosInstance.get(
          `/liked-songs/check/${songId}`
        );
        setLocalLiked(response.data.liked);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkSingleSongLikeStatus();
  }, [songId, isSignedIn, getToken]);

  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      toast.error("Please sign in to like songs", {
        icon: "🔒",
        duration: 3000,
      });
      return;
    }

    // Prevent multiple rapid clicks by checking if already loading
    if (isLoading) return;

    setIsLoading(true);

    // Set local state for immediate UI feedback
    setLocalLiked(!isLiked);

    try {
      // Ensure token is fresh
      const token = await getToken();
      if (token) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
      }

      const liked = await toggleLike(songId);

      if (liked) {
        toast.success("Added to your Liked Songs");
      } else {
        toast.success("Removed from your Liked Songs");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert local state if there was an error
      setLocalLiked(isLiked);
      toast.error("Failed to update like status");
    } finally {
      // Add a small delay before allowing another like/unlike action
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  };

  // Use the debounce hook
  const debouncedToggleLike = useDebounceClick(handleToggleLike, 200, 300);

  return (
    <button
      onClick={debouncedToggleLike}
      disabled={isLoading}
      className={cn(
        "transition-transform duration-200 hover:scale-110 active:scale-95",
        showBackground && "bg-black/40 p-2 rounded-full",
        className
      )}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          isSignedIn && isLiked
            ? "fill-red-500 text-red-500"
            : "text-white hover:text-red-400",
          isLoading && "animate-pulse"
        )}
      />
    </button>
  );
};

export default LikeButton;
