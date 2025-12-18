'use client';

import { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Send, Plus, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatConversation, ChatMessage } from '@/lib/types';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, where, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { markMessagesAsRead } from '@/lib/chat-utils';
import { NewChatDialog } from '@/components/new-chat-dialog';

function formatTimestamp(timestamp: Date | undefined) {
    if (!timestamp) return '';
    if (isToday(timestamp)) {
        return format(timestamp, 'p');
    }
    if (isYesterday(timestamp)) {
        return 'Yesterday';
    }
    return format(timestamp, 'P');
}

export default function MessagesPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const conversationsQuery = useMemoFirebase(
      () => user ? query(
          collection(firestore, 'chats'), 
          where('participants', 'array-contains', user.uid),
          orderBy('lastMessageTimestamp', 'desc')
      ) : null,
      [firestore, user]
    );
    const { data: conversations, isLoading: loadingConversations } = useCollection<ChatConversation>(conversationsQuery);
    
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemoFirebase(
        () => activeConversation ? query(
            collection(firestore, 'chats', activeConversation.id, 'messages'),
            orderBy('timestamp', 'asc')
        ) : null,
        [firestore, activeConversation]
    );
    const { data: messages, isLoading: loadingMessages } = useCollection<ChatMessage>(messagesQuery);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/messages');
        }
    }, [isUserLoading, user, router]);

    useEffect(() => {
        if (activeConversation && user && firestore) {
            markMessagesAsRead(firestore, activeConversation.id, user.uid);
        }
    }, [activeConversation, user, firestore]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (isUserLoading || !user) {
        return <Skeleton className="h-[calc(100vh-8rem)] w-full" />
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !activeConversation || !newMessage.trim()) return;

        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            const otherUserId = activeConversation.participants.find(id => id !== user.uid);
            if (!otherUserId) return;

            await addDoc(collection(firestore, 'chats', activeConversation.id, 'messages'), {
                content: messageContent,
                senderId: user.uid,
                receiverId: otherUserId,
                timestamp: serverTimestamp(),
                isRead: false,
            });

            await updateDoc(doc(firestore, 'chats', activeConversation.id), {
                lastMessage: messageContent,
                lastMessageTimestamp: serverTimestamp(),
                lastMessageSenderId: user.uid,
                [`unreadCount_${otherUserId}`]: increment(1),
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageContent);
        }
    }

    return (
        <Card className="h-[calc(100vh-8rem)] flex">
            <div className={`w-full md:w-1/3 border-r flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-bold">Messages</h1>
                        <Button size="sm" onClick={() => setShowNewChat(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            New
                        </Button>
                    </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages..." className="pl-10" />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {loadingConversations && <div className="p-4 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>}
                    {conversations && conversations.map((convo) => {
                        const otherUserId = convo.participants.find(id => id !== user.uid);
                        const otherUserName = otherUserId ? convo.participantNames[otherUserId] : 'Unknown';
                        const otherUserAvatar = otherUserId ? convo.participantAvatars[otherUserId] : '';
                        const unreadCount = (convo as any)[`unreadCount_${user.uid}`] || 0;
                        
                        return (
                            <button
                                key={convo.id}
                                className={cn(
                                    "flex w-full items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors",
                                    activeConversation?.id === convo.id && "bg-muted"
                                )}
                                onClick={() => {
                                    setActiveConversation(convo);
                                    setShowMobileChat(true);
                                }}
                            >
                                <Avatar>
                                    <AvatarImage src={otherUserAvatar} />
                                    <AvatarFallback>{otherUserName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold truncate">{otherUserName}</p>
                                        <p className="text-xs text-muted-foreground">{formatTimestamp(convo.lastMessageTimestamp?.toDate())}</p>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                                        {unreadCount > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </ScrollArea>
            </div>
            <div className={`w-full md:w-2/3 flex flex-col ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                {activeConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="md:hidden"
                                onClick={() => setShowMobileChat(false)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            {(() => {
                                const otherUserId = activeConversation.participants.find(id => id !== user.uid);
                                const otherUserName = otherUserId ? activeConversation.participantNames[otherUserId] : 'Unknown';
                                const otherUserAvatar = otherUserId ? activeConversation.participantAvatars[otherUserId] : '';
                                return (
                                    <>
                                        <Avatar>
                                            <AvatarImage src={otherUserAvatar} />
                                            <AvatarFallback>{otherUserName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <h2 className="text-lg font-semibold">{otherUserName}</h2>
                                    </>
                                );
                            })()}
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="flex flex-col gap-4">
                                {loadingMessages && <p>Loading messages...</p>}
                                {messages && messages.map((msg) => {
                                    const isSent = msg.senderId === user.uid;
                                    return (
                                        <div key={msg.id} className={cn("flex", isSent ? "justify-end" : "justify-start")}>
                                            <div
                                                className={cn(
                                                    "max-w-xs rounded-lg px-4 py-2",
                                                    isSent
                                                        ? "bg-accent text-accent-foreground"
                                                        : "bg-muted"
                                                )}
                                            >
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={cn("text-xs mt-1 text-right", isSent ? "text-accent-foreground/70" : "text-muted-foreground")}>
                                                    {formatTimestamp(msg.timestamp?.toDate())}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="relative">
                                <Input 
                                    placeholder="Type a message..." 
                                    className="pr-12" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-muted-foreground">
                        <p>Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
            <NewChatDialog
                open={showNewChat}
                onOpenChange={setShowNewChat}
                currentUser={user}
                onConversationCreated={(conversationId) => {
                    // Find the conversation in the list and set it as active
                    const conversation = conversations?.find(c => c.id === conversationId);
                    if (conversation) {
                        setActiveConversation(conversation);
                    }
                }}
            />
        </Card>
    );
}
