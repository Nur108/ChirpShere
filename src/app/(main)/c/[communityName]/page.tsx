'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { collection, query, where, getDocs, limit, orderBy, doc, setDoc, deleteDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PostItem, PostItemStyle } from '@/components/post-item';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Community, Post, User } from '@/lib/types';
import { use, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function CommunityHeader({ community }: { community: Community }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isMember, setIsMember] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    
    const membersQuery = useMemoFirebase(
        () => community?.id ? query(collection(firestore, 'communities', community.id, 'members')) : null,
        [firestore, community?.id]
    );
    const { data: members } = useCollection<{userId: string, userName: string, joinedAt: any}>(membersQuery);

    useEffect(() => {
        async function checkMembership() {
            if (!firestore || !user || !community?.id) return;
            const memberDoc = await getDoc(doc(firestore, 'communities', community.id, 'members', user.uid));
            setIsMember(memberDoc.exists());
        }
        checkMembership();
    }, [firestore, user, community?.id]);

    const handleJoinToggle = async () => {
        if (!firestore || !user || !community?.id) return;
        setIsJoining(true);
        try {
            if (isMember) {
                await deleteDoc(doc(firestore, 'communities', community.id, 'members', user.uid));
                await updateDoc(doc(firestore, 'communities', community.id), {
                    memberCount: increment(-1)
                });
                setIsMember(false);
                toast({ title: "Left community" });
            } else {
                await setDoc(doc(firestore, 'communities', community.id, 'members', user.uid), {
                    userId: user.uid,
                    userName: user.displayName || user.email,
                    joinedAt: new Date()
                });
                await updateDoc(doc(firestore, 'communities', community.id), {
                    memberCount: increment(1)
                });
                setIsMember(true);
                toast({ title: "Joined community!" });
            }
        } catch (error) {
            console.error('Error toggling membership:', error);
            toast({ variant: "destructive", title: "Failed to update membership" });
        } finally {
            setIsJoining(false);
        }
    }; 

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
                    <Button 
                        onClick={handleJoinToggle} 
                        disabled={isJoining}
                        variant={isMember ? 'destructive' : 'default'}
                    >
                        {isJoining ? 'Loading...' : (isMember ? 'Leave' : 'Join')}
                    </Button>
                    {isMember && (
                        <Button variant="outline" asChild>
                            <Link href={`/c/${community.slug}/submit`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Post
                            </Link>
                        </Button>
                    )}
                </div>
            )}
          </div>
          <p className="mt-4 text-sm">{community.description}</p>
          <Dialog>
            <DialogTrigger asChild>
              <button className="mt-2 text-xs text-muted-foreground hover:underline">
                {community.memberCount.toLocaleString()} members
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Members of c/{community.slug}</DialogTitle>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {members?.map(member => (
                  <div key={member.userId} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.userName}</p>
                    </div>
                    {member.userId === community.ownerId && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
}

export default function CommunityPage({ params }: { params: Promise<{ communityName: string }> }) {
  const { communityName } = use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [isMember, setIsMember] = useState(false);

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
        const communityWithId = { ...communityData, id: snapshot.docs[0].id };
        setCommunity(communityWithId);
        
        // Check if user is a member
        if (user) {
            const memberDoc = await getDoc(doc(firestore, 'communities', communityWithId.id, 'members', user.uid));
            setIsMember(memberDoc.exists());
        }
        
        setLoadingCommunity(false);
    }
    getCommunity();
  }, [firestore, communityName, user]);


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
                    {isMember && (
                        <Button variant="outline" asChild className="mt-4">
                            <Link href={`/c/${community.slug}/submit`}>Be the first to post!</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
