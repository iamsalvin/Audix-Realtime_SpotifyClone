import { Song } from "@/types";
import SectionGridSkeleton from "./SectionGridSkeleton";
import { Button } from "@/components/ui/button";
import SongCard from "@/components/SongCard";
import { useLikedSongsStore } from "@/stores/useLikedSongsStore";
import { useEffect } from "react";

type SectionGridProps = {
	title: string;
	songs: Song[];
	isLoading: boolean;
};

const SectionGrid = ({ songs, title, isLoading }: SectionGridProps) => {
	const { checkBulkLikeStatus } = useLikedSongsStore();

	// Check like status for all songs in this section
	useEffect(() => {
		if (songs.length > 0) {
			const songIds = songs.map(song => song._id);
			checkBulkLikeStatus(songIds);
		}
	}, [songs, checkBulkLikeStatus]);

	if (isLoading) return <SectionGridSkeleton />;

	return (
		<div className='mb-8'>
			<div className='flex items-center justify-between mb-4 px-2 sm:px-0'>
				<h2 className='text-lg sm:text-2xl font-bold'>{title}</h2>
				<Button variant='link' className='text-xs sm:text-sm text-zinc-400 hover:text-white'>
					Show all
				</Button>
			</div>

			<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 px-2 sm:px-0'>
				{songs.map((song) => (
					<SongCard key={song._id} song={song} />
				))}
			</div>
		</div>
	);
};
export default SectionGrid;
