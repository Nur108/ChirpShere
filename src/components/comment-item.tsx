'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CornerDownRight } from 'lucide-react';

import { type Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { VoteButtons } from './vote-buttons';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface CommentWithReplies {
  comment: CommentType;
  replies: CommentWithReplies[];
}

interface CommentItemProps {
  comment: CommentType;
  replies: CommentWithReplies[];
  postId: string;
}

export function CommentItem({ comment, replies, postId }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const createdAt = comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date();

  const handleReplySubmit = async () => {
    if (!firestore || !user || !replyContent.trim()) return;

    try {
        await addDoc(collection(firestore, 'posts', postId, 'comments'), {
            content: replyContent,
            authorId: user.uid,
            authorName: user.displayName || user.email,
            authorAvatarUrl: user.photoURL,
            parentId: comment.id,
            createdAt: serverTimestamp(),
            upvotes: 0,
            downvotes: 0,
        });
        
        // Update post comment count
        await updateDoc(doc(firestore, 'posts', postId), {
            commentCount: increment(1)
        });
        
        setReplyContent('');
        setIsReplying(false);
        toast({ title: 'Reply posted!' });
    } catch (error) {
        console.error("Error posting reply: ", error);
        toast({ variant: 'destructive', title: 'Failed to post reply.' });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorName} />
            <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="w-px flex-1 bg-border my-2" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{comment.authorName}</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <VoteButtons initialUpvotes={comment.upvotes} initialDownvotes={comment.downvotes} postId={postId} commentId={comment.id} />
            {user && (
                <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)}>
                    <CornerDownRight className="mr-2 h-4 w-4" />
                    Reply
                </Button>
            )}
          </div>
        </div>
      </div>
      
      {isReplying && (
        <div className="ml-5 pl-6 border-l">
          <Textarea 
            placeholder={`Replying to ${comment.authorName}...`} 
            className="mb-2" 
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
            <Button size="sm" onClick={handleReplySubmit} disabled={!replyContent.trim()}>Submit</Button>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-5 pl-6 border-l">
          {replies.map(reply => (
            <CommentItem key={reply.comment.id} {...reply} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}
