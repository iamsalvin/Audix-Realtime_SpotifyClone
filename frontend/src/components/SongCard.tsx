import { Song } from "@/types";
import PlayButton from "@/pages/home/components/PlayButton";
import LikeButton from "./LikeButton";
import DownloadButton from "./DownloadButton";
import { useLikedSongsStore } from "@/stores/useLikedSongsStore";
import { useEffect } from "react";

interface SongCardProps {
  song: Song;
  showLikeButton?: boolean;
}

const SongCard = ({ song, showLikeButton = true }: SongCardProps) => {
  const { checkBulkLikeStatus } = useLikedSongsStore();

  // Check like status when card mounts
  useEffect(() => {
    checkBulkLikeStatus([song._id]);
  }, [song._id, checkBulkLikeStatus]);

  return (
    <div
      className="bg-zinc-800/40 p-2 sm:p-4 rounded-md hover:bg-zinc-700/40 
      transition-all group cursor-pointer relative"
    >
      <div className="relative mb-2 sm:mb-4">
        <div className="aspect-square rounded-md shadow-lg overflow-hidden">
          <img
            src={song.imageUrl}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-300 
            group-hover:scale-105"
          />
        </div>
        
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayButton song={song} />
        </div>
        
        {showLikeButton && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <LikeButton songId={song._id} showBackground={true} />
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DownloadButton song={song} />
        </div>
      </div>
      
      <h3 className="text-xs sm:text-base font-medium mb-1 sm:mb-2 truncate">{song.title}</h3>
      <p className="text-[10px] sm:text-sm text-zinc-400 truncate">{song.artist}</p>
    </div>
  );
};

export default SongCard;
