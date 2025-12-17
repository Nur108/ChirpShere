'use client';

import { useState, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatConversation, ChatMessage } from '@/lib/types';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

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
    const { user, isUserLoading } = useAuth();
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

    if (isUserLoading || !user) {
        return <Skeleton className="h-[calc(100vh-8rem)] w-full" />
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !activeConversation || !newMessage.trim()) return;

        const messageContent = newMessage.trim();
        setNewMessage('');

        await addDoc(collection(firestore, 'chats', activeConversation.id, 'messages'), {
            content: messageContent,
            senderId: user.uid,
            receiverId: activeConversation.userId,
            timestamp: serverTimestamp(),
            isRead: false,
        });

        // In a real app, a cloud function would update the chat document's lastMessage fields
    }

    return (
        <Card className="h-[calc(100vh-8rem)] flex">
            <div className="w-1/3 border-r flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold">Messages</h1>
                     <div className="relative mt-2">
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
                    {conversations && conversations.map((convo) => (
                        <button
                            key={convo.id}
                            className={cn(
                                "flex w-full items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors",
                                activeConversation?.id === convo.id && "bg-muted"
                            )}
                            onClick={() => setActiveConversation(convo)}
                        >
                            <Avatar>
                                <AvatarImage src={convo.userAvatar} />
                                <AvatarFallback>{convo.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold truncate">{convo.userName}</p>
                                    <p className="text-xs text-muted-foreground">{formatTimestamp(convo.lastMessageTimestamp?.toDate())}</p>
                                </div>
                                <div className="flex justify-between items-start">
                                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                                    {convo.unreadCount > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                                            {convo.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </ScrollArea>
            </div>
            <div className="w-2/3 flex flex-col">
                {activeConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={activeConversation.userAvatar} />
                                <AvatarFallback>{activeConversation.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h2 className="text-lg font-semibold">{activeConversation.userName}</h2>
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
        </Card>
    );
}
