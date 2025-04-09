import { DebouncedButton } from "@/components/ui/debounced-button";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { Song } from "@/types";
import { Download } from "lucide-react";
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

  // Check if user is premium - but still show button for all users
  const isPremium = premiumStatus?.isPremium || false;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events

    // If already downloading, prevent multiple attempts
    if (isDownloading) return;

    try {
      setIsDownloading(true);

      // If not premium, show upgrade toast but still allow download
      if (!isPremium) {
        toast.success(
          "Consider upgrading to Premium for higher quality downloads!",
          {
            duration: 3000,
            icon: "⭐",
          }
        );
      }

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
        className={`text-zinc-400 hover:text-white ${className}`}
        title="Download song"
        debounceDelay={300}
        threshold={500}
      >
        <Download className="h-5 w-5" />
      </DebouncedButton>
    );
  }

  return (
    <DebouncedButton
      variant="outline"
      onClickDebounced={handleDownload}
      disabled={isDownloading}
      className={`flex items-center gap-2 ${className}`}
      debounceDelay={300}
      threshold={500}
    >
      <Download className="h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download"}
    </DebouncedButton>
  );
};

export default DownloadButton;
