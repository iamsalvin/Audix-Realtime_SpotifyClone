import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMusicStore } from "@/stores/useMusicStore";
import { Calendar, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState } from "react";

const SongsTable = () => {
  const { songs, isLoading, error, deleteSong, fetchAdminSongs } =
    useMusicStore();
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh with optimistic UI updates
  const handleRefresh = async () => {
    if (refreshing) return; // Prevent multiple refreshes

    setRefreshing(true);
    const toastId = toast.loading("Refreshing songs...");

    try {
      // Start a timer to show minimum loading state (prevents flickering)
      const minLoadingPromise = new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      // Fetch songs
      const fetchPromise = fetchAdminSongs();

      // Wait for both minimum loading time and fetch to complete
      await Promise.all([minLoadingPromise, fetchPromise]);

      toast.success("Songs refreshed", { id: toastId });
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Failed to refresh songs", { id: toastId });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle song deletion with optimistic UI update
  const handleDeleteSong = (songId: string, songTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${songTitle}"?`)) {
      return;
    }

    // Show loading toast
    const toastId = toast.loading(`Deleting "${songTitle}"...`);

    deleteSong(songId)
      .then(() => {
        toast.success(`"${songTitle}" deleted`, { id: toastId });
      })
      .catch((error) => {
        console.error("Delete error:", error);
        toast.error(`Failed to delete "${songTitle}"`, { id: toastId });
      });
  };

  if (isLoading && !songs.length) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-zinc-400 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading songs...
        </div>
      </div>
    );
  }

  if (error && !songs.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-red-400">{error}</div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </>
          )}
        </Button>
      </div>
    );
  }

  if (!songs || songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-zinc-400">No songs found</div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-zinc-400">
          {songs.length} song{songs.length !== 1 ? "s" : ""} found
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="transition-all"
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </>
          )}
        </Button>
      </div>

      <div
        className={`${
          isLoading && refreshing ? "opacity-50 pointer-events-none" : ""
        } transition-opacity`}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-zinc-800/50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {songs.map((song) => (
              <TableRow key={song._id} className="hover:bg-zinc-800/50">
                <TableCell>
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    className="size-10 rounded object-cover"
                    onError={(e) => {
                      // Fallback image if the URL is broken
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/200x200?text=No+Image";
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {song.title || "Untitled"}
                </TableCell>
                <TableCell>{song.artist || "Unknown Artist"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    {song.createdAt
                      ? song.createdAt.split("T")[0]
                      : "Unknown date"}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant={"ghost"}
                      size={"sm"}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() =>
                        handleDeleteSong(song._id, song.title || "Untitled")
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
export default SongsTable;
