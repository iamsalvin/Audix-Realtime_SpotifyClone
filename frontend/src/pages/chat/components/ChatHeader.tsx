import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { usePremiumStore } from "@/stores/usePremiumStore";
import PremiumBadge from "@/components/PremiumBadge";

const ChatHeader = () => {
	const { selectedUser, onlineUsers } = useChatStore();
	const { premiumUsers } = usePremiumStore();

	if (!selectedUser) return null;

	// Create a Set of premium user ClerkIDs for faster lookup
	const premiumUserIds = new Set(premiumUsers.map(user => user.clerkId));

	return (
		<div className='p-4 border-b border-zinc-800'>
			<div className='flex items-center gap-3'>
				<Avatar>
					<AvatarImage src={selectedUser.imageUrl} />
					<AvatarFallback>{selectedUser.fullName[0]}</AvatarFallback>
				</Avatar>
				<div>
					<div className="flex items-center">
						<h2 className='font-medium'>{selectedUser.fullName}</h2>
						{premiumUserIds.has(selectedUser.clerkId) && <PremiumBadge size="sm" />}
					</div>
					<p className='text-sm text-zinc-400'>
						{onlineUsers.has(selectedUser.clerkId) ? "Online" : "Offline"}
					</p>
				</div>
			</div>
		</div>
	);
};
export default ChatHeader;
