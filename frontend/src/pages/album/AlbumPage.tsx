import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Clock, Pause, Play } from "lucide-react";
import DownloadButton from "@/components/DownloadButton";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

export const formatDuration = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const AlbumPage = () => {
	const { albumId } = useParams();
	const { fetchAlbumById, currentAlbum, isLoading } = useMusicStore();
	const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();

	useEffect(() => {
		if (albumId) fetchAlbumById(albumId);
	}, [fetchAlbumById, albumId]);

	if (isLoading) return null;

	const handlePlayAlbum = () => {
		if (!currentAlbum) return;

		const isCurrentAlbumPlaying = currentAlbum?.songs.some((song) => song._id === currentSong?._id);
		if (isCurrentAlbumPlaying) togglePlay();
		else {
			// start playing the album from the beginning
			playAlbum(currentAlbum?.songs, 0);
		}
	};

	const handlePlaySong = (index: number) => {
		if (!currentAlbum) return;

		playAlbum(currentAlbum?.songs, index);
	};

	return (
		<div className='h-full'>
			<ScrollArea className='h-full rounded-md'>
				{/* Main Content */}
				<div className='relative min-h-full'>
					{/* bg gradient */}
					<div
						className='absolute inset-0 bg-gradient-to-b from-[#5038a0]/80 via-zinc-900/80
					 to-zinc-900 pointer-events-none'
						aria-hidden='true'
					/>

					{/* Content */}
					<div className='relative z-10'>
						{/* Album header section */}
						<div className='flex flex-col sm:flex-row p-3 sm:p-6 gap-3 sm:gap-6 pb-4 sm:pb-8'>
							<img
								src={currentAlbum?.imageUrl}
								alt={currentAlbum?.title}
								className='w-[160px] h-[160px] sm:w-[240px] sm:h-[240px] mx-auto sm:mx-0 shadow-xl rounded'
							/>
							<div className='flex flex-col justify-end text-center sm:text-left'>
								<p className='text-xs sm:text-sm font-medium'>Album</p>
								<h1 className='text-2xl sm:text-7xl font-bold my-2 sm:my-4'>{currentAlbum?.title}</h1>
								<div className='flex flex-wrap justify-center sm:justify-start items-center gap-2 text-xs sm:text-sm text-zinc-100'>
									<span className='font-medium text-white'>{currentAlbum?.artist}</span>
									<span>• {currentAlbum?.songs.length} songs</span>
									<span>• {currentAlbum?.releaseYear}</span>
								</div>
							</div>
						</div>

						{/* Play button - centered on mobile */}
						<div className='px-3 sm:px-6 pb-4 sm:pb-4 flex justify-center sm:justify-start'>
							<Button
								onClick={handlePlayAlbum}
								size='icon'
								className='w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-green-500 hover:bg-green-400 
                hover:scale-105 transition-all'
								>
								{isPlaying && currentAlbum?.songs.some((song) => song._id === currentSong?._id) ? (
									<Pause className='h-7 w-7 text-black' />
								) : (
									<Play className='h-7 w-7 text-black' />
								)}
							</Button>
						</div>

						{/* Songs list section */}
						<div className='bg-black/20 backdrop-blur-sm mt-2 sm:mt-0'>
							{/* table header */}
							<div
								className='grid grid-cols-[16px_1fr_auto] sm:grid-cols-[16px_4fr_2fr_1fr] gap-2 sm:gap-4 
            px-2 sm:px-10 py-3 text-xs sm:text-sm text-zinc-400 border-b border-white/5'
							>
								<div>#</div>
								<div>Title</div>
								<div className='hidden sm:block'>Released Date</div>
								<div>
									<Clock className='h-4 w-4' />
								</div>
							</div>

							{/* songs list with improved mobile spacing */}
							<div className='px-2 sm:px-6'>
								<div className='space-y-2 py-2 sm:py-4'>
									{currentAlbum?.songs.map((song, index) => {
										const isCurrentSong = currentSong?._id === song._id;
										return (
											<div
												key={song._id}
												onClick={() => handlePlaySong(index)}
												className={`grid grid-cols-[16px_1fr_auto] sm:grid-cols-[16px_4fr_2fr_1fr] 
                      gap-2 sm:gap-4 px-2 sm:px-4 py-3 sm:py-2 text-xs sm:text-sm text-zinc-400 
                      hover:bg-white/5 rounded-md group cursor-pointer`}
											>
												<div className='flex items-center justify-center'>
													{isCurrentSong && isPlaying ? (
														<div className='size-4 text-green-500'>♫</div>
													) : (
														<span className='group-hover:hidden'>{index + 1}</span>
													)}
													{!isCurrentSong && (
														<Play className='h-4 w-4 hidden group-hover:block' />
													)}
												</div>

												<div className='flex items-center gap-2 sm:gap-3 min-w-0'>
													<img 
														src={song.imageUrl} 
														alt={song.title} 
														className='size-8 sm:size-10 rounded-sm' 
													/>
													<div className='min-w-0'>
														<div className='font-medium text-white truncate'>{song.title}</div>
														<div className='truncate'>{song.artist}</div>
													</div>
												</div>
												<div className='hidden sm:flex items-center'>{song.createdAt.split("T")[0]}</div>
												<div className='flex items-center gap-2'>
													<DownloadButton song={song} />
													<div className='text-right'>{formatDuration(song.duration)}</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				</div>
			</ScrollArea>
		</div>
	);
};
export default AlbumPage;
