'use client';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { doc } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VoteButtons } from '@/components/vote-buttons';
import { CommentSection } from '@/components/comment-section';
import { Link as LinkIcon } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Post } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { use } from 'react';

export default function PostPage({ params }: { params: Promise<{ postId: string, communityName: string }> }) {
    const { postId, communityName } = use(params);
    const firestore = useFirestore();

    const postRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'posts', postId) : null),
      [firestore, postId]
    );
    const { data: post, isLoading } = useDoc<Post>(postRef);
    
    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card>
                    <div className="p-6">
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-6" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </Card>
            </div>
        );
    }

    if (!post) {
        notFound();
    }
    
    // This check ensures that the URL is canonical
    if (post.communitySlug !== communityName) {
        notFound();
    }
    
    const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();

  return (
    <div className="max-w-4xl mx-auto">
        <Card>
            <div className="flex">
                <div className="hidden md:flex flex-col items-center p-4 bg-muted/50">
                    <VoteButtons initialUpvotes={post.upvotes} initialDownvotes={post.downvotes} postId={post.id} />
                </div>
                <div className="flex-1">
                    <CardHeader className="p-4 md:p-6">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           {post.communityIconUrl && (
                             <Avatar className="h-6 w-6">
                                 <AvatarImage src={post.communityIconUrl} alt={post.communitySlug} />
                                 <AvatarFallback>{post.communitySlug.charAt(0)}</AvatarFallback>
                             </Avatar>
                            )}
                            <Link href={`/c/${post.communitySlug}`} className="font-bold hover:underline">
                                c/{post.communitySlug}
                            </Link>
                            <span className="text-gray-500">•</span>
                            <span>
                                Posted by u/{post.authorName}
                            </span>
                            <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
                        </div>
                        <CardTitle className="text-xl md:text-2xl mt-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        {post.postType === 'image' && post.imageUrl && (
                        <div className="relative mt-2 max-h-[500px] overflow-hidden rounded-md border">
                            <Image
                            src={post.imageUrl}
                            alt={post.title}
                            width={800}
                            height={600}
                            className="w-full h-auto object-contain"
                            data-ai-hint="post image"
                            />
                        </div>
                        )}
                        {post.postType === 'text' && (
                        <p className="text-base text-foreground/90 whitespace-pre-wrap">{post.content}</p>
                        )}
                        {post.postType === 'link' && (
                        <a href={post.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-4 bg-muted rounded-md hover:bg-muted/80">
                            <LinkIcon className="h-5 w-5" />
                            <span className="text-sm truncate">{post.content}</span>
                        </a>
                        )}
                    </CardContent>
                </div>
            </div>
        </Card>
        
        <CommentSection postId={post.id} />
    </div>
  );
}
