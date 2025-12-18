'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { type Comment as CommentType } from '@/lib/types';
import { CommentItem } from './comment-item';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, increment, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

interface CommentSectionProps {
  postId: string;
}

interface CommentWithReplies {
  comment: CommentType;
  replies: CommentWithReplies[];
}

export function CommentSection({ postId }: CommentSectionProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const commentsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'desc')) : null,
    [firestore, postId]
  );
  const { data: postComments, isLoading, error: commentsError } = useCollection<CommentType>(commentsQuery);

  // Log any errors for debugging
  if (commentsError) {
    console.error('Comments loading error:', commentsError);
  }

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{comment: string}>();
  
  const onCommentSubmit = async (data: {comment: string}) => {
    if (!firestore || !user) return;

    try {
        await addDoc(collection(firestore, 'posts', postId, 'comments'), {
            content: data.comment,
            authorId: user.uid,
            authorName: user.displayName || user.email,
            authorAvatarUrl: user.photoURL,
            parentId: null,
            createdAt: serverTimestamp(),
            upvotes: 0,
            downvotes: 0,
        });
        
        // Update post comment count
        await updateDoc(doc(firestore, 'posts', postId), {
            commentCount: increment(1)
        });
        
        reset();
        toast({ title: "Comment posted!" });
    } catch(e) {
        console.error("Error posting comment: ", e);
        toast({ variant: "destructive", title: "Failed to post comment." });
    }
  };
  
  const commentTree = useMemoFirebase(() => {
    if (!postComments) return [];
    
    const commentMap = new Map(postComments.map(c => [c.id, { comment: c, replies: [] as CommentWithReplies[] }]));
    const rootComments: CommentWithReplies[] = [];

    for (const c of commentMap.values()) {
        if (c.comment.parentId) {
            commentMap.get(c.comment.parentId)?.replies.push(c);
        } else {
            rootComments.push(c);
        }
    }
    return rootComments;
  }, [postComments]);


  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Comments ({postComments?.length || 0})</h2>
      
      {user ? (
        <form onSubmit={handleSubmit(onCommentSubmit)} className="mb-6">
            <p className="text-sm mb-2">Comment as <span className="font-semibold">{user.displayName || user.email}</span></p>
            <Textarea 
            {...register('comment', { required: true })}
            placeholder="What are your thoughts?"
            rows={4}
            />
            <div className="flex justify-end mt-2">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Posting...' : 'Comment'}</Button>
            </div>
        </form>
      ) : (
        <div className="mb-6 text-center p-4 border rounded-md bg-muted/50">
            <p className="text-muted-foreground">
                <Button variant="link" asChild><Link href="/login">Log in</Link></Button> 
                or 
                <Button variant="link" asChild><Link href="/signup">sign up</Link></Button> 
                to leave a comment.
            </p>
        </div>
      )}


      {isLoading && (
        <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      )}

      <div className="flex flex-col gap-6">
        {commentTree && commentTree.map(c => (
          <CommentItem key={c.comment.id} comment={c.comment} replies={c.replies} postId={postId} />
        ))}
      </div>
    </div>
  );
}
