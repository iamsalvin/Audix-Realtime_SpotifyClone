import React from "react";
import Topbar from "@/components/Topbar";
import AdminAccessButton from "@/components/AdminAccessButton";
import { useMusicStore } from "@/stores/useMusicStore";
import { useActivityStore } from "@/stores/useActivityStore";
import { useEffect, useState } from "react";
import FeaturedSection from "./components/FeaturedSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useMoodStore } from "@/stores/useMoodStore";
import SongCard from "@/components/SongCard";
import { Link } from "react-router-dom";
import { Song } from "@/types";
import { 
	Heart, 
	Music, 
	Zap, 
	Coffee, 
	HeartCrack, 
	Sparkles, 
	PartyPopper, 
	Smile, 
	Headphones,
	Clock,
	ArrowRight,
	LucideIcon
} from "lucide-react";

// Mood icon mapping
const MOOD_ICONS: Record<string, LucideIcon> = {
	happy: Smile,
	sad: HeartCrack,
	energetic: Zap,
	focus: Coffee,
	heartbreak: HeartCrack,
	relax: Headphones,
	love: Heart,
	feel_good: Sparkles,
	party: PartyPopper,
	chill: Music
};

// Mood color mapping
const MOOD_COLORS: Record<string, string> = {
	happy: "from-yellow-500 to-amber-600",
	sad: "from-blue-500 to-indigo-600",
	energetic: "from-red-500 to-orange-600",
	focus: "from-slate-500 to-slate-700",
	heartbreak: "from-pink-500 to-purple-600",
	relax: "from-teal-500 to-green-600",
	love: "from-pink-500 to-rose-600",
	feel_good: "from-green-500 to-emerald-600",
	party: "from-purple-500 to-violet-600",
	chill: "from-blue-500 to-cyan-600"
};

const HomePage = () => {
	const {
		fetchFeaturedSongs,
		fetchMadeForYouSongs,
		fetchTrendingSongs,
		isLoading,
		madeForYouSongs,
		featuredSongs,
		trendingSongs,
	} = useMusicStore();

	const { 
		availableMoods, 
		songsByMood, 
		fetchAvailableMoods, 
		fetchSongsByMood
	} = useMoodStore();

	const {
		fetchActivityData,
		activityData
	} = useActivityStore();

	const [activeTab, setActiveTab] = useState("all");
	const { initializeQueue } = usePlayerStore();

	// Fetch main sections
	useEffect(() => {
		fetchFeaturedSongs();
		fetchMadeForYouSongs();
		fetchTrendingSongs();
		fetchActivityData();
	}, [fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs, fetchActivityData]);

	// Fetch moods and songs by mood
	useEffect(() => {
		fetchAvailableMoods();
		fetchSongsByMood(); // fetch songs for all moods
	}, [fetchAvailableMoods, fetchSongsByMood]);

	useEffect(() => {
		if (madeForYouSongs.length > 0 && featuredSongs.length > 0 && trendingSongs.length > 0) {
			const allSongs = [...featuredSongs, ...madeForYouSongs, ...trendingSongs];
			initializeQueue(allSongs);
		}
	}, [initializeQueue, madeForYouSongs, trendingSongs, featuredSongs]);

	// Function to get user-friendly mood name
	const getMoodLabel = (mood: string) => {
		const foundMood = availableMoods.find(m => m.value === mood);
		return foundMood ? foundMood.label : mood.charAt(0).toUpperCase() + mood.slice(1).replace('_', ' ');
	};

	// Format date for recently played
	const formatDate = (dateString: Date | string) => {
		if (!dateString) return "";
		
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	};

	// Render mood card component
	const MoodCard = ({ mood, isActive, onClick }: { mood: string, isActive: boolean, onClick: () => void }) => {
		const MoodIcon = MOOD_ICONS[mood] || Music;
		const colorClass = MOOD_COLORS[mood] || "from-gray-700 to-gray-800";
		
		return (
			<div 
				onClick={onClick}
				className={`
					cursor-pointer rounded-xl overflow-hidden transition-all duration-300
					${isActive ? 'ring-2 ring-white scale-105' : 'opacity-80 hover:opacity-100 hover:scale-105'}
				`}
			>
				<div className={`bg-gradient-to-br ${colorClass} p-4 h-full flex flex-col items-center justify-center`}>
					{MoodIcon && React.createElement(MoodIcon, { className: "h-10 w-10 mb-2" })}
					<span className="font-semibold text-center">{getMoodLabel(mood)}</span>
				</div>
			</div>
		);
	};

	return (
		<main className='rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900'>
			<Topbar />
			<ScrollArea className='h-[calc(100vh-180px)]'>
				<div className='p-4 sm:p-6'>
					<h1 className='text-2xl sm:text-3xl font-bold mb-6'>Good afternoon</h1>
					
					{/* Admin Access Button - only visible to admin users */}
					<div className="mb-6">
						<AdminAccessButton />
					</div>
					
					<FeaturedSection />

					{/* Main music sections first */}
					<div className='space-y-8 mt-8'>
						<SectionGrid title='Made For You' songs={madeForYouSongs} isLoading={isLoading} />
						<SectionGrid title='Trending' songs={trendingSongs} isLoading={isLoading} />
					</div>

					{/* Recently Played Section */}
					{activityData && activityData.recentlyPlayed && activityData.recentlyPlayed.length > 0 && (
						<div className="mt-8 pt-2">
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-2">
									<Clock className="h-5 w-5 text-zinc-400" />
									<h2 className="text-xl font-bold">Recently Played</h2>
								</div>
								<Link 
									to="/activity" 
									className="text-sm text-zinc-400 hover:text-white flex items-center gap-1"
								>
									View Activity <ArrowRight className="h-4 w-4" />
								</Link>
							</div>
							
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
								{activityData.recentlyPlayed.slice(0, 5).map((activity: any) => {
									// Check if the song data is available either directly or in the songId reference
									const songData = activity.songId as Song;
									
									if (!songData) return null;
									
									return (
										<div key={activity._id} className="relative group">
											<SongCard song={songData} />
											<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-xs text-white/80">
												{formatDate(activity.lastPlayed)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Mood-based sections with visual cards */}
					<div className="mt-10 mb-12">
						<h2 className="text-xl sm:text-2xl font-bold mb-6">Browse by Mood</h2>
						
						{/* Mood Cards Grid */}
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
							<MoodCard 
								mood="all" 
								isActive={activeTab === "all"} 
								onClick={() => setActiveTab("all")} 
							/>
							
							{availableMoods.map((mood) => (
								<MoodCard 
									key={mood.value} 
									mood={mood.value} 
									isActive={activeTab === mood.value} 
									onClick={() => setActiveTab(mood.value)} 
								/>
							))}
						</div>
						
						{/* Content Area */}
						<div className="mt-6">
							{activeTab === "all" ? (
								<div className="space-y-12">
									{Object.keys(songsByMood).map((mood) => (
										songsByMood[mood] && songsByMood[mood].length > 0 && (
											<div key={mood} className="bg-zinc-800/30 p-4 rounded-lg">
												<div className="flex items-center gap-3 mb-4">
													{MOOD_ICONS[mood] && React.createElement(MOOD_ICONS[mood], { className: "h-6 w-6" })}
													<h3 className="text-xl font-bold">{getMoodLabel(mood)}</h3>
												</div>
												<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
													{songsByMood[mood].slice(0, 5).map(song => (
														<SongCard key={song._id} song={song} />
													))}
												</div>
												{songsByMood[mood].length > 5 && (
													<div className="mt-3 text-right">
														<button 
															onClick={() => setActiveTab(mood)} 
															className="text-sm text-zinc-400 hover:text-white hover:underline"
														>
															View all {songsByMood[mood].length} songs
														</button>
													</div>
												)}
											</div>
										)
									))}
								</div>
							) : (
								<div className="bg-zinc-800/30 p-4 rounded-lg">
									<div className="flex items-center gap-3 mb-6">
										{MOOD_ICONS[activeTab] && React.createElement(MOOD_ICONS[activeTab], { className: "h-6 w-6" })}
										<h3 className="text-xl font-bold">{getMoodLabel(activeTab)}</h3>
									</div>
									
									{songsByMood[activeTab] && songsByMood[activeTab].length > 0 ? (
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
											{songsByMood[activeTab].map(song => (
												<SongCard key={song._id} song={song} />
											))}
										</div>
									) : (
										<div className="text-center py-12 text-zinc-400">
											<Music className="h-16 w-16 mx-auto mb-4 opacity-50" />
											<p>No songs available for this mood yet.</p>
											<p className="text-sm mt-2">Check back later or try another mood.</p>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</ScrollArea>
		</main>
	);
};
export default HomePage;
