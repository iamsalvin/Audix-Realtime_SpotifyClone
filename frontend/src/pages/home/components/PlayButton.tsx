import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types";
import { Pause, Play } from "lucide-react";
import { DebouncedButton } from "@/components/ui/debounced-button";

const PlayButton = ({ song }: { song: Song }) => {
  const { currentSong, isPlaying, play, togglePlay } = usePlayerStore() as any;
  const isCurrentSong = currentSong?._id === song._id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click events

    if (isCurrentSong) {
      // Toggle play/pause if this is the current song
      togglePlay();
    } else {
      // Find the song index in the queue or add it if not present
      const existingIndex = usePlayerStore
        .getState()
        .queue.findIndex((s) => s._id === song._id);

      if (existingIndex >= 0) {
        // If song is in queue, play at that index
        play(song, existingIndex);
      } else {
        // If song is not in queue, create a new queue with just this song
        const newQueue = [song, ...usePlayerStore.getState().queue];
        usePlayerStore.getState().setQueue(newQueue);
        play(song, 0);
      }
    }
  };

  return (
    <DebouncedButton
      size={"icon"}
      onClickDebounced={handlePlay}
      debounceDelay={200}
      threshold={300}
      className={`absolute bottom-3 right-2 bg-green-500 hover:bg-green-400 transition-all 
        opacity-0 translate-y-2 group-hover:translate-y-0 ${
          isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
    >
      {isCurrentSong && isPlaying ? (
        <Pause className="size-5 text-black" />
      ) : (
        <Play className="size-5 text-black" />
      )}
    </DebouncedButton>
  );
};

export default PlayButton;
