'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { User } from '@/lib/types';
import { createOrGetConversation } from '@/lib/chat-utils';
import { User as FirebaseUser } from 'firebase/auth';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: FirebaseUser;
  onConversationCreated: (conversationId: string) => void;
}

export function NewChatDialog({ open, onOpenChange, currentUser, onConversationCreated }: NewChatDialogProps) {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const usersQuery = useMemoFirebase(
    () => searchTerm.length > 0 ? query(
      collection(firestore, 'users'),
      limit(10)
    ) : null,
    [firestore, searchTerm]
  );

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const handleStartChat = async (user: User) => {
    try {
      const conversationId = await createOrGetConversation(
        firestore,
        currentUser,
        user.id,
        user.username,
        user.avatarUrl
      );
      onConversationCreated(conversationId);
      onOpenChange(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground">Searching...</p>}
            {users && users
              .filter(user => user.id !== currentUser.uid)
              .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((user) => (
                <button
                  key={user.id}
                  className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => handleStartChat(user)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </button>
              ))}
            {users && users.length === 0 && searchTerm && (
              <p className="text-sm text-muted-foreground">No users found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}