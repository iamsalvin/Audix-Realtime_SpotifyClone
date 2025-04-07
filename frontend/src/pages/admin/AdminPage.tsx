import { useAuthStore } from "@/stores/useAuthStore";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import { Album, Music } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SongsTabContent from "./components/SongsTabContent";
import AlbumsTabContent from "./components/AlbumsTabContent";
import { useEffect, useState } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
	const { isAdmin, isLoading, setAdminStatus } = useAuthStore();
	const [adminChecked, setAdminChecked] = useState(false);
	const navigate = useNavigate();

	const { fetchAlbums, fetchSongs, fetchStats } = useMusicStore();

	useEffect(() => {
		// Check localStorage directly as a fallback
		const storedAdminStatus = localStorage.getItem('isAdmin');
		
		if (storedAdminStatus === 'true' && !isAdmin) {
			console.log("Setting admin status from localStorage");
			setAdminStatus(true);
		}
		
		setAdminChecked(true);

		fetchAlbums();
		fetchSongs();
		fetchStats();
	}, [fetchAlbums, fetchSongs, fetchStats, isAdmin, setAdminStatus]);

	// Navigate to admin login if not admin after checking
	useEffect(() => {
		if (adminChecked && !isAdmin && !isLoading) {
			console.log("Not authorized as admin, redirecting to login");
			navigate("/admin-login");
		}
	}, [adminChecked, isAdmin, isLoading, navigate]);

	// Show loading state while checking admin status
	if (!adminChecked || isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex items-center justify-center">
				<p className="text-zinc-100 text-xl">Loading admin dashboard...</p>
			</div>
		);
	}

	// Don't show unauthorized message, just redirect (handled by useEffect)
	if (!isAdmin) return null;

	return (
		<div
			className='min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900
   to-black text-zinc-100 p-8'
		>
			<Header />

			<DashboardStats />

			<Tabs defaultValue='songs' className='space-y-6'>
				<TabsList className='p-1 bg-zinc-800/50'>
					<TabsTrigger value='songs' className='data-[state=active]:bg-zinc-700'>
						<Music className='mr-2 size-4' />
						Songs
					</TabsTrigger>
					<TabsTrigger value='albums' className='data-[state=active]:bg-zinc-700'>
						<Album className='mr-2 size-4' />
						Albums
					</TabsTrigger>
				</TabsList>

				<TabsContent value='songs'>
					<SongsTabContent />
				</TabsContent>
				<TabsContent value='albums'>
					<AlbumsTabContent />
				</TabsContent>
			</Tabs>
		</div>
	);
};
export default AdminPage;
