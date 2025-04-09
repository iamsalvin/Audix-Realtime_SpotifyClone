import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, X, Music } from "lucide-react";
import SongCard from "@/components/SongCard";
import { useSearchStore } from "@/stores/useSearchStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";

const SearchPage = () => {
  const { query, results, isLoading, setQuery, searchSongs, clearResults } =
    useSearchStore();
  const { songs, fetchSongs, isLoading: isLoadingSongs } = useMusicStore();
  const [localQuery, setLocalQuery] = useState(query);
  const debouncedQuery = useDebounce(localQuery, 300);

  // Load all songs on initial render if no search is active
  useEffect(() => {
    if (songs.length === 0) {
      fetchSongs();
    }
  }, [fetchSongs, songs.length]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      setQuery(debouncedQuery);
      searchSongs();
    } else if (debouncedQuery === "") {
      clearResults();
    }
  }, [debouncedQuery, searchSongs, setQuery, clearResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalQuery("");
    clearResults();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Search Music</h1>

          <div className="relative max-w-2xl mb-8 mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search className="size-4" />
            </div>
            <Input
              type="text"
              placeholder="Search for songs, artists, or albums..."
              value={localQuery}
              onChange={handleInputChange}
              className="bg-zinc-800/40 border-zinc-700/50 pl-10 pr-10 py-5 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
            />
            {localQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md bg-zinc-700/40 hover:bg-zinc-600/70 text-zinc-400 hover:text-white"
                onClick={handleClearSearch}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {/* Search Results */}
          <div className="mt-8">
            <div className="flex items-center mb-6">
              <div className="h-8 w-1 bg-zinc-600 rounded-full mr-3"></div>
              <h2 className="text-xl font-bold">
                {query ? `Results for "${query}"` : "Browse All Songs"}
              </h2>
              {query && results.length > 0 && (
                <span className="ml-3 px-2 py-1 bg-zinc-800/70 rounded-md text-xs text-zinc-300">
                  {results.length} {results.length === 1 ? "song" : "songs"}
                </span>
              )}
            </div>

            {isLoading || isLoadingSongs ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-zinc-800/40 p-4 rounded-md animate-pulse"
                  >
                    <div className="aspect-square bg-zinc-700 rounded-md mb-4"></div>
                    <div className="h-4 bg-zinc-700 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 || query ? (
              results.length > 0 ? (
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {results.map((song) => (
                    <motion.div key={song._id} variants={itemVariants}>
                      <SongCard song={song} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-12 bg-zinc-800/30 rounded-lg shadow-inner">
                  <Music className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
                  <p className="text-lg text-zinc-300 mb-2">
                    No songs found for "{query}"
                  </p>
                  <p className="text-sm text-zinc-400">
                    Try adjusting your search or browse our library below
                  </p>
                </div>
              )
            ) : (
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {songs.map((song) => (
                  <motion.div key={song._id} variants={itemVariants}>
                    <SongCard song={song} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </ScrollArea>
    </main>
  );
};

export default SearchPage;
