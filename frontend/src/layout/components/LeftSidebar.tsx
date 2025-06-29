import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/stores/useMusicStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { SignedIn } from "@clerk/clerk-react";
import { HomeIcon, Library, MessageCircle, ShieldCheck, Heart, BarChart2 } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const LeftSidebar = () => {
	const { albums, fetchAlbums, isLoading } = useMusicStore();
	const { isAdmin } = useAuthStore();
  
	// Add debug logging for admin status
	useEffect(() => {
		// Check localStorage directly
		const adminStatus = localStorage.getItem('isAdmin');
		console.log("Admin status in sidebar:", { 
			isAdminFromStore: isAdmin, 
			isAdminFromLocalStorage: adminStatus,
			adminStatusType: typeof adminStatus
		});
	}, [isAdmin]);

	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	// Use localStorage directly as a fallback 
	const adminStatusFromStorage = localStorage.getItem('isAdmin') === 'true';
	const showAdminButton = isAdmin || adminStatusFromStorage;

	console.log({ albums });

	return (
		<div className='h-full flex flex-col gap-2 overflow-hidden'>
			{/* Navigation menu */}
			<div className='rounded-lg bg-zinc-900 p-4'>
				<div className='space-y-2'>
					<Link
						to={"/"}
						className={cn(
							buttonVariants({
								variant: "ghost",
								className: "w-full justify-start text-white hover:bg-zinc-800",
							})
						)}
					>
						<HomeIcon className='mr-2 size-5' />
						<span className='hidden md:inline'>Home</span>
					</Link>

					<SignedIn>
						<Link
							to={"/liked-songs"}
							className={cn(
								buttonVariants({
									variant: "ghost",
									className: "w-full justify-start text-white hover:bg-zinc-800",
								})
							)}
						>
							<Heart className='mr-2 size-5' />
							<span className='hidden md:inline'>Liked Songs</span>
						</Link>

						<Link
							to={"/activity"}
							className={cn(
								buttonVariants({
									variant: "ghost",
									className: "w-full justify-start text-white hover:bg-zinc-800",
								})
							)}
						>
							<BarChart2 className='mr-2 size-5' />
							<span className='hidden md:inline'>Activity</span>
						</Link>

						<Link
							to={"/chat"}
							className={cn(
								buttonVariants({
									variant: "ghost",
									className: "w-full justify-start text-white hover:bg-zinc-800",
								})
							)}
						>
							<MessageCircle className='mr-2 size-5' />
							<span className='hidden md:inline'>Messages</span>
						</Link>
					</SignedIn>
					
					{/* Show admin button if user is admin (check both store and localStorage) */}
					{showAdminButton && (
						<Link
							to={"/admin"}
							className={cn(
								buttonVariants({
									variant: "ghost",
									className: "w-full justify-start text-emerald-500 hover:text-emerald-400 hover:bg-zinc-800",
								})
							)}
						>
							<ShieldCheck className='mr-2 size-5' />
							<span className='hidden md:inline'>Admin Dashboard</span>
						</Link>
					)}
				</div>
			</div>

			{/* Library section */}
			<div className='flex-1 rounded-lg bg-zinc-900 p-4 overflow-hidden flex flex-col min-h-0'>
				<div className='flex items-center justify-between mb-4 flex-shrink-0'>
					<div className='flex items-center text-white px-2'>
						<Library className='size-5 mr-2' />
						<span className='hidden md:inline'>Playlists</span>
					</div>
				</div>

				<ScrollArea className='flex-1 min-h-0'>
					<div className='space-y-2 pr-4'>
						{isLoading ? (
							<PlaylistSkeleton />
						) : (
							albums.map((album) => (
								<Link
									to={`/albums/${album._id}`}
									key={album._id}
									className='p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer'
								>
									<img
										src={album.imageUrl}
										alt='Playlist img'
										className='size-12 rounded-md flex-shrink-0 object-cover'
									/>

									<div className='flex-1 min-w-0 hidden md:block'>
										<p className='font-medium truncate'>{album.title}</p>
										<p className='text-sm text-zinc-400 truncate'>Album • {album.artist}</p>
									</div>
								</Link>
							))
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
};
export default LeftSidebar;
