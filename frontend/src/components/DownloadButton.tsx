import { Button } from "@/components/ui/button";
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

const DownloadButton = ({ song, variant = "icon", className = "" }: DownloadButtonProps) => {
  const { premiumStatus } = usePremiumStore();
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Check if user is premium
  const isPremium = premiumStatus?.isPremium || false;
  
  if (!isPremium) {
    return null; // Don't show download button for non-premium users
  }
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    try {
      setIsDownloading(true);
      
      // Create a link element
      const link = document.createElement('a');
      
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
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download song');
    } finally {
      setIsDownloading(false);
    }
  };
  
  if (variant === "icon") {
    return (
      <Button
        size="icon"
        variant="ghost"
        onClick={handleDownload}
        disabled={isDownloading}
        className={`text-zinc-400 hover:text-white ${className}`}
        title="Download song"
      >
        <Download className="h-5 w-5" />
      </Button>
    );
  }
  
  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={isDownloading}
      className={`flex items-center gap-2 ${className}`}
    >
      <Download className="h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download"}
    </Button>
  );
};

export default DownloadButton;
