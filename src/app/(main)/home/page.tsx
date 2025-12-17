'use client';
import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';

import { PostItem, PostItemStyle } from '@/components/post-item';
import { Skeleton } from '@/components/ui/skeleton';
import { type Post } from '@/lib/types';


export default function HomePage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const postsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  
  const { data: posts, isLoading } = useCollection<Post>(postsQuery);

  if (isLoading) {
    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold font-headline">Your Personalized Feed</h1>
                <p className="text-muted-foreground">Top posts from your favorite communities, ranked for you by AI.</p>
            </header>
            <div className="flex flex-col gap-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-headline">Your Feed</h1>
        <p className="text-muted-foreground">Top posts from your favorite communities.</p>
      </header>
      <div className="flex flex-col gap-4">
        <PostItemStyle />
        {posts && posts.map(post => {
          return <PostItem key={post.id} post={post} />;
        })}
      </div>
    </div>
  );
}
