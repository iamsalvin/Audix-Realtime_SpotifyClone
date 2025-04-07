import Topbar from "@/components/Topbar";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./components/MessageInput";

const formatTime = (date: string) => {
	return new Date(date).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const ChatPage = () => {
	const { user } = useUser();
	const { messages, selectedUser, fetchUsers, fetchMessages } = useChatStore();
	const lastMessageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (user) fetchUsers();
	}, [fetchUsers, user]);

	useEffect(() => {
		if (selectedUser) fetchMessages(selectedUser.clerkId);
	}, [selectedUser, fetchMessages]);

	useEffect(() => {
		setTimeout(() => {
			lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	}, [messages]);

	return (
		<main className='h-full rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden'>
			<Topbar />

			<div className='grid lg:grid-cols-[300px_1fr] grid-cols-[80px_1fr] h-[calc(100vh-180px)]'>
				<UsersList />

				{/* chat message */}
				<div className='flex flex-col h-full'>
					{selectedUser ? (
						<>
							<ChatHeader />

							{/* Messages */}
							<ScrollArea className='h-[calc(100vh-340px)]'>
								<div className='p-2 sm:p-4 space-y-3'>
									{messages.map((message, index) => (
										<div
											key={message._id}
											ref={index === messages.length - 1 ? lastMessageRef : null}
											className={`flex items-start gap-2 sm:gap-3 ${
												message.senderId === user?.id ? "flex-row-reverse" : ""
											}`}
										>
											<Avatar className='size-6 sm:size-8 flex-shrink-0'>
												<AvatarImage
													src={
														message.senderId === user?.id
															? user.imageUrl
															: selectedUser.imageUrl
													}
												/>
											</Avatar>

											<div
												className={`rounded-lg p-2 sm:p-3 max-w-[75%] sm:max-w-[70%]
													${message.senderId === user?.id ? "bg-green-500" : "bg-zinc-800"}
												`}
											>
												<p className='text-xs sm:text-sm break-words'>{message.content}</p>
												<span className='text-[10px] sm:text-xs text-zinc-300/90 mt-1 block'>
													{formatTime(message.createdAt)}
												</span>
											</div>
										</div>
									))}
								</div>
							</ScrollArea>

							<MessageInput />
						</>
					) : (
						<NoConversationPlaceholder />
					)}
				</div>
			</div>
		</main>
	);
};
export default ChatPage;

const NoConversationPlaceholder = () => (
	<div className='flex flex-col items-center justify-center h-full space-y-6'>
		<img src='/audix.png' alt='Audix' className='size-16 animate-bounce' />
		<div className='text-center'>
			<h3 className='text-zinc-300 text-lg font-medium mb-1'>No conversation selected</h3>
			<p className='text-zinc-500 text-sm'>Choose a friend to start chatting</p>
		</div>
	</div>
);