'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PostItem, PostItemStyle } from '@/components/post-item';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Community, Post } from '@/lib/types';
import { use, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function CommunityHeader({ community }: { community: Community }) {
    const { user } = useUser();
    // In a real app, this would be a more complex state
    const isMember = true; 

    return (
        <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-muted" />
        <CardContent className="p-4">
          <div className="flex items-end -mt-12">
            <Avatar className="h-20 w-20 border-4 border-card">
              <AvatarImage src={community.iconUrl} alt={community.name} />
              <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h1 className="text-2xl font-bold font-headline">{community.name}</h1>
              <p className="text-sm text-muted-foreground">c/{community.slug}</p>
            </div>
            {user && (
                <div className="ml-auto flex items-center gap-2">
                    <Button>{isMember ? 'Joined' : 'Join'}</Button>
                    <Button variant="outline" asChild>
                        <Link href={`/c/${community.slug}/submit`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Post
                        </Link>
                    </Button>
                </div>
            )}
          </div>
          <p className="mt-4 text-sm">{community.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">{community.memberCount.toLocaleString()} members</p>
        </CardContent>
      </Card>
    )
}

export default function CommunityPage({ params }: { params: Promise<{ communityName: string }> }) {
  const { communityName } = use(params);
  const firestore = useFirestore();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  useEffect(() => {
    async function getCommunity() {
        if (!firestore) return;
        setLoadingCommunity(true);
        const communityQuery = query(
            collection(firestore, 'communities'), 
            where('slug', '==', communityName), 
            limit(1)
        );
        const snapshot = await getDocs(communityQuery);
        if (snapshot.empty) {
            notFound();
        }
        const communityData = snapshot.docs[0].data() as Community;
        setCommunity({ ...communityData, id: snapshot.docs[0].id });
        setLoadingCommunity(false);
    }
    getCommunity();
  }, [firestore, communityName]);


  const postsQuery = useMemoFirebase(
    () => community?.id ? query(collection(firestore, 'posts'), where('communityId', '==', community.id), orderBy('createdAt', 'desc')) : null,
    [firestore, community?.id]
  );
  
  const { data: posts, isLoading: loadingPosts } = useCollection<Post>(postsQuery);

  if (loadingCommunity || !community) {
    return (
        <div className="max-w-4xl mx-auto">
            <Skeleton className="h-48 w-full mb-6" />
            <div className="flex flex-col gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CommunityHeader community={community} />
      
      <div className="flex flex-col gap-4">
        <PostItemStyle />
        {loadingPosts && (
             <div className="flex flex-col gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )}
        {posts && posts.map(post => {
          return <PostItem key={post.id} post={post} />;
        })}
        {!loadingPosts && posts?.length === 0 && (
            <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                    <p>No posts in this community yet.</p>
                    <Button variant="outline" asChild className="mt-4">
                        <Link href={`/c/${community.slug}/submit`}>Be the first to post!</Link>
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
