import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import FriendsActivity from "./components/FriendsActivity";
import PlayerWithPremium from "@/components/PlayerWithPremium";
import { PlaybackControls } from "./components/PlaybackControls";
import { useEffect, useState } from "react";
import { usePremiumStore } from "@/stores/usePremiumStore";

const MainLayout = () => {
	const [isMobile, setIsMobile] = useState(false);
	const { checkPremiumStatus } = usePremiumStore();

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);
	
	// Check premium status when layout mounts
	useEffect(() => {
		// Force premium status to be checked on every page load
		console.log('MainLayout mounted, checking premium status');
		checkPremiumStatus();
		
		// Set up interval to periodically check premium status
		const premiumCheckInterval = setInterval(() => {
			console.log('Periodic premium status check');
			checkPremiumStatus();
		}, 30000); // Check every 30 seconds
		
		return () => clearInterval(premiumCheckInterval);
	}, [checkPremiumStatus]);

	return (
		<div className='h-screen bg-black text-white flex flex-col'>
			<ResizablePanelGroup direction='horizontal' className='flex-1 flex h-full overflow-hidden p-2'>
				<PlayerWithPremium />
				{/* left sidebar */}
				<ResizablePanel defaultSize={20} minSize={isMobile ? 0 : 10} maxSize={30}>
					<LeftSidebar />
				</ResizablePanel>

				<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

				{/* Main content */}
				<ResizablePanel defaultSize={isMobile ? 80 : 60}>
					<Outlet />
				</ResizablePanel>

				{!isMobile && (
					<>
						<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

						{/* right sidebar */}
						<ResizablePanel defaultSize={20} minSize={0} maxSize={25} collapsedSize={0}>
							<FriendsActivity />
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>

			<PlaybackControls />
		</div>
	);
};
export default MainLayout;
