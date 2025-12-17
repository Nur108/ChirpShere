// Using a client component to easily access search params.
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Community, Post, User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

function CommunityResult({ community }: { community: Community }) {
  return (
    <Link href={`/c/${community.slug}`} className="block hover:bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={community.iconUrl} alt={community.name} />
                <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">{community.name}</p>
                <p className="text-sm text-muted-foreground">{community.memberCount.toLocaleString()} members</p>
            </div>
        </div>
    </Link>
  );
}

function PostResult({ post }: { post: Post }) {
    return (
        <Link href={`/c/${post.communitySlug}/posts/${post.id}`} className="block hover:bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">c/{post.communitySlug}</p>
            <p className="font-semibold mt-1">{post.title}</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
        </Link>
    );
}

function UserResult({ user }: { user: User }) {
    return (
        <div className="flex items-center gap-3 p-3">
            <Avatar>
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">u/{user.username}</p>
            </div>
        </div>
    );
}


export default function SearchPage() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const q = searchParams.get('q') || '';
  
  const [results, setResults] = useState<{posts: Post[], communities: Community[], users: User[]}>({posts: [], communities: [], users: []});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function performSearch() {
        if (!firestore || !q) {
            setResults({posts: [], communities: [], users: []});
            setLoading(false);
            return;
        };
        setLoading(true);

        // This is a very basic search. For a real app, use a dedicated search service like Algolia or Elasticsearch.
        const postsQuery = query(collection(firestore, 'posts'), where('title', '>=', q), where('title', '<=', q + '\uf8ff'), limit(10));
        const communitiesQuery = query(collection(firestore, 'communities'), where('name', '>=', q), where('name', '<=', q + '\uf8ff'), limit(10));
        const usersQuery = query(collection(firestore, 'users'), where('username', '>=', q), where('username', '<=', q + '\uf8ff'), limit(10));

        const [postsSnap, communitiesSnap, usersSnap] = await Promise.all([
            getDocs(postsQuery),
            getDocs(communitiesQuery),
            getDocs(usersQuery),
        ]);

        const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        const communities = communitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        setResults({ posts, communities, users });
        setLoading(false);
    }
    performSearch();
  }, [firestore, q]);

  if (loading) {
      return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold font-headline">Search results for &quot;{q}&quot;</h1>
            </header>
            <p>Loading...</p>
        </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-headline">Search results for &quot;{q}&quot;</h1>
      </header>
      
      <Tabs defaultValue="posts" className="w-full">
        <TabsList>
          <TabsTrigger value="posts">Posts ({results.posts.length})</TabsTrigger>
          <TabsTrigger value="communities">Communities ({results.communities.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({results.users.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <Card>
            <CardContent className="p-0">
                <div className="flex flex-col divide-y">
                    {results.posts.length > 0 ? results.posts.map(p => <PostResult key={p.id} post={p}/>) : <p className="p-6 text-center text-muted-foreground">No posts found.</p>}
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="communities">
           <Card>
            <CardContent className="p-0">
                <div className="flex flex-col divide-y">
                    {results.communities.length > 0 ? results.communities.map(c => <CommunityResult key={c.id} community={c}/>) : <p className="p-6 text-center text-muted-foreground">No communities found.</p>}
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
           <Card>
            <CardContent className="p-0">
                <div className="flex flex-col divide-y">
                    {results.users.length > 0 ? results.users.map(u => <UserResult key={u.id} user={u}/>) : <p className="p-6 text-center text-muted-foreground">No users found.</p>}
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
