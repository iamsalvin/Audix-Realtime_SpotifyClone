import { DebouncedButton } from "@/components/ui/debounced-button";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { Song } from "@/types";
import { Download, Lock } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface DownloadButtonProps {
  song: Song;
  variant?: "icon" | "default";
  className?: string;
}

const DownloadButton = ({
  song,
  variant = "icon",
  className = "",
}: DownloadButtonProps) => {
  const { premiumStatus } = usePremiumStore();
  const [isDownloading, setIsDownloading] = useState(false);

  // Check if user is premium
  const isPremium = premiumStatus?.isPremium || false;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events

    // If already downloading, prevent multiple attempts
    if (isDownloading) return;

    // If not premium, show upgrade message and don't allow download
    if (!isPremium) {
      toast.error(
        "Downloading songs requires a premium subscription. Please upgrade to premium!",
        {
          duration: 4000,
          icon: "🔒",
        }
      );
      return;
    }

    try {
      setIsDownloading(true);

      // Create a link element
      const link = document.createElement("a");

      // Set the href to the song's audio URL
      link.href = song.audioUrl;

      // Set the download attribute to the song's title
      link.download = `${song.title} - ${song.artist}.mp3`;

      // Append the link to the document
      document.body.appendChild(link);

      // Simulate a click on the link
      link.click();

      // Remove the link from the document
      document.body.removeChild(link);

      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download song");
    } finally {
      // Set a small delay before allowing another download
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    }
  };

  if (variant === "icon") {
    return (
      <DebouncedButton
        size="icon"
        variant="ghost"
        onClickDebounced={handleDownload}
        disabled={isDownloading}
        className={`${
          isPremium ? "text-zinc-400 hover:text-white" : "text-zinc-500"
        } ${className}`}
        title={isPremium ? "Download song" : "Premium users only"}
        debounceDelay={300}
        threshold={500}
      >
        {isPremium ? (
          <Download className="h-5 w-5" />
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </DebouncedButton>
    );
  }

  return (
    <DebouncedButton
      variant={isPremium ? "outline" : "secondary"}
      onClickDebounced={handleDownload}
      disabled={isDownloading}
      className={`flex items-center gap-2 ${className} ${
        !isPremium ? "bg-zinc-800 text-zinc-500" : ""
      }`}
      debounceDelay={300}
      threshold={500}
    >
      {isPremium ? (
        <>
          <Download className="h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download"}
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" />
          Premium Only
        </>
      )}
    </DebouncedButton>
  );
};

export default DownloadButton;
