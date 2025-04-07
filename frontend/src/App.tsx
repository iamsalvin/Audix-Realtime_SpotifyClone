import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import MainLayout from "./layout/MainLayout";
import ChatPage from "./pages/chat/ChatPage";
import AlbumPage from "./pages/album/AlbumPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminLoginPage from "./pages/admin-login/AdminLoginPage";
import LikedSongsPage from "./pages/liked-songs/LikedSongsPage";
import ActivityPage from "./pages/activity/ActivityPage";
import PremiumPage from "./pages/premium/PremiumPage";

import { Toaster } from "react-hot-toast";
import NotFoundPage from "./pages/404/NotFoundPage";

function App() {
	return (
		<>
			<Routes>
				<Route
					path='/sso-callback'
					element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
				/>
				<Route path='/auth-callback' element={<AuthCallbackPage />} />
				<Route path='/admin' element={<AdminPage />} />
				<Route path='/admin-login' element={<AdminLoginPage />} />

				<Route element={<MainLayout />}>
					<Route path='/' element={<HomePage />} />
					<Route path='/chat' element={<ChatPage />} />
					<Route path='/albums/:albumId' element={<AlbumPage />} />
					<Route path='/liked-songs' element={<LikedSongsPage />} />
					<Route path='/activity' element={<ActivityPage />} />
					<Route path='/premium' element={<PremiumPage />} />
					<Route path='*' element={<NotFoundPage />} />
				</Route>
			</Routes>
			<Toaster />
		</>
	);
}

export default App;
