import Topbar from "@/components/Topbar";
import { useLikedSongsStore } from "@/stores/useLikedSongsStore";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Loader, Music } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Song } from "@/types";
import DownloadButton from "@/components/DownloadButton";

// Simple song card component for the liked songs page
const SongCard = ({ song }: { song: Song }) => {
  const { play } = usePlayerStore();
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    play(song, 0);
  };

  return (
    <div className="bg-zinc-800/40 p-2 sm:p-4 rounded-md hover:bg-zinc-700/40 transition-all group cursor-pointer relative">
      <div className="relative mb-2 sm:mb-4">
        <div className="aspect-square rounded-md shadow-lg overflow-hidden">
          <img
            src={song.imageUrl}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handlePlay}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-2.5 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>
        
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DownloadButton song={song} />
        </div>
      </div>
      
      <h3 className="text-xs sm:text-base font-medium mb-1 sm:mb-2 truncate">{song.title}</h3>
      <p className="text-[10px] sm:text-sm text-zinc-400 truncate">{song.artist}</p>
    </div>
  );
};

const LikedSongsPage = () => {
  const { likedSongs, fetchLikedSongs, isLoading } = useLikedSongsStore();
  const { play, setQueue } = usePlayerStore();

  // Fetch liked songs when the component mounts
  useEffect(() => {
    fetchLikedSongs();
  }, [fetchLikedSongs]);

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      setQueue(likedSongs);
      play(likedSongs[0], 0); // Play the first song
    }
  };

  return (
    <main className='rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900'>
      <Topbar />
      <ScrollArea className='h-[calc(100vh-180px)]'>
        <div className='p-4 sm:p-6'>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-rose-500 to-red-600 p-4 rounded-lg shadow-lg">
                <Heart className="size-10 text-white" />
              </div>
              <div>
                <h4 className="text-sm uppercase text-zinc-400 font-medium">Playlist</h4>
                <h1 className='text-3xl font-bold'>Liked Songs</h1>
              </div>
            </div>
            
            <SignedIn>
              {likedSongs.length > 0 && (
                <Button 
                  onClick={handlePlayAll}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Play All
                </Button>
              )}
            </SignedIn>
          </div>

          <SignedIn>
            {isLoading ? (
              <div className="flex justify-center my-12">
                <Loader className="size-8 text-emerald-500 animate-spin" />
              </div>
            ) : likedSongs.length === 0 ? (
              <EmptyLikedSongs />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {likedSongs.map((song) => (
                  <SongCard key={song._id} song={song} />
                ))}
              </div>
            )}
          </SignedIn>

          <SignedOut>
            <div className="flex flex-col items-center justify-center h-[40vh] text-center">
              <Heart className="size-16 text-zinc-700 mb-4" />
              <h2 className="text-xl font-bold mb-2">Sign in to see your liked songs</h2>
              <p className="text-zinc-400 max-w-md mb-6">
                Create a collection of your favorite songs. Sign in to start liking songs and access them from anywhere.
              </p>
              <SignInButton mode="modal">
                <Button>
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </ScrollArea>
    </main>
  );
};

const EmptyLikedSongs = () => (
  <div className="flex flex-col items-center justify-center h-[40vh] text-center">
    <Music className="size-16 text-zinc-700 mb-4" />
    <h2 className="text-xl font-bold mb-2">No liked songs yet</h2>
    <p className="text-zinc-400 max-w-md">
      Start listening and tap the heart icon on songs you love to add them to your liked songs collection.
    </p>
  </div>
);

export default LikedSongsPage;
