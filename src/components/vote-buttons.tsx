"use client";

import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { doc, writeBatch, increment } from 'firebase/firestore';

interface VoteButtonsProps {
  initialUpvotes: number;
  initialDownvotes: number;
  postId: string;
  commentId?: string;
}

export function VoteButtons({ initialUpvotes, initialDownvotes, postId, commentId }: VoteButtonsProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  
  // This should come from user-specific data in a real app
  const [userVote, setUserVote] = useState<'up'|'down'|null>(null); 
  const [optimisticVoteCount, setOptimisticVoteCount] = useState(initialUpvotes - initialDownvotes);


  const handleVote = async (newVote: 'up' | 'down') => {
    if (!user || !firestore) {
      // TODO: Prompt user to log in
      return;
    }

    const newVoteStatus = userVote === newVote ? null : newVote;
    const oldVote = userVote;
    
    // Optimistic UI update logic
    let newOptimisticCount = optimisticVoteCount;
    if (oldVote === newVote) { // Undoing vote
        newOptimisticCount += newVote === 'up' ? -1 : 1;
    } else if (oldVote) { // Changing vote
        newOptimisticCount += newVote === 'up' ? 2 : -2;
    } else { // New vote
        newOptimisticCount += newVote === 'up' ? 1 : -1;
    }
    setOptimisticVoteCount(newOptimisticCount);
    setUserVote(newVoteStatus);

    // Firestore update logic
    const collectionName = commentId ? 'comments' : 'posts';
    const docId = commentId || postId;
    const docRef = doc(firestore, collectionName, docId);
    const voteDocRef = doc(firestore, `users/${user.uid}/${collectionName}_votes`, docId);

    const batch = writeBatch(firestore);

    if (newVoteStatus === null) { // Removing vote
        batch.delete(voteDocRef);
        batch.update(docRef, { [oldVote === 'up' ? 'upvotes' : 'downvotes']: increment(-1) });
    } else { // Adding or changing vote
        batch.set(voteDocRef, { vote: newVoteStatus });
        if (oldVote === null) { // New vote
            batch.update(docRef, { [newVoteStatus === 'up' ? 'upvotes' : 'downvotes']: increment(1) });
        } else { // Changing vote
            batch.update(docRef, {
                [oldVote === 'up' ? 'upvotes' : 'downvotes']: increment(-1),
                [newVoteStatus === 'up' ? 'upvotes' : 'downvotes']: increment(1)
            });
        }
    }
    
    try {
        await batch.commit();
    } catch(e) {
        // Revert optimistic update on failure
        setOptimisticVoteCount(initialUpvotes - initialDownvotes);
        setUserVote(oldVote);
        console.error("Failed to apply vote", e);
    }
  };
  
  return (
    <div className="flex md:flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 rounded-full transition-colors duration-200', {
          'text-accent bg-accent/10 hover:text-accent': userVote === 'up',
          'hover:text-accent': userVote !== 'up',
        })}
        onClick={() => handleVote('up')}
        aria-label="Upvote"
        disabled={!user}
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
      <span
        className={cn('font-bold text-sm transition-colors duration-200', {
          'text-accent': userVote === 'up',
          'text-destructive': userVote === 'down',
        })}
      >
        {optimisticVoteCount}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 rounded-full transition-colors duration-200', {
          'text-destructive bg-destructive/10 hover:text-destructive': userVote === 'down',
          'hover:text-destructive': userVote !== 'down',
        })}
        onClick={() => handleVote('down')}
        aria-label="Downvote"
        disabled={!user}
      >
        <ArrowDown className="h-5 w-5" />
      </Button>
    </div>
  );
}
