'use client';
import Link from 'next/link';
import { Home, Compass, Plus } from 'lucide-react';
import Image from 'next/image';
import { collection, query, where } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Community } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

function MyCommunities() {
  const firestore = useFirestore();
  const { user } = useUser();

  // This is a placeholder for getting user's subscribed communities.
  // In a real app, you'd have a 'user_communities' collection to track subscriptions.
  // For now, we'll show communities they own.
  const communitiesQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'communities'), where('ownerId', '==', user.uid)) : null),
    [firestore, user]
  );
  
  const { data: userCommunities, isLoading } = useCollection<Community>(communitiesQuery);

  if (isLoading) {
      return (
          <>
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </>
      )
  }

  if (!userCommunities || userCommunities.length === 0) {
      return <p className="text-xs text-muted-foreground px-2">You haven&apos;t joined any communities yet.</p>
  }

  return (
    <SidebarMenu>
      {userCommunities.map((community) => (
        <SidebarMenuItem key={community.id}>
          <SidebarMenuButton asChild size="sm" className="w-full justify-start" tooltip={community.name}>
            <Link href={`/c/${community.slug}`}>
              <Image src={community.iconUrl} alt={community.name} width={20} height={20} className="rounded-full" />
              <span className="truncate">{community.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}


export function AppSidebar() {
  const { user } = useUser();

  return (
    <Sidebar>
      <SidebarContent className="p-2 flex flex-col">
        <div className="flex flex-col gap-1">
           <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="w-full justify-start" variant="ghost">
                        <Link href="/home">
                            <Home />
                            Home
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="w-full justify-start" variant="ghost">
                        <Link href="/communities">
                            <Compass />
                            All Communities
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
           </SidebarMenu>
        </div>
        <Separator className="my-4" />
        {user && (
            <SidebarGroup>
                <SidebarGroupLabel className="flex justify-between items-center">
                    My Communities
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href="/communities/create">
                            <Plus className="h-4 w-4" />
                        </Link>
                    </Button>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <MyCommunities />
                </SidebarGroupContent>
            </SidebarGroup>
        )}
         <div className="mt-auto flex flex-col gap-2">
            <Separator className="my-2" />
            <SidebarGroup>
                <SidebarGroupLabel>
                    Resources
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size="sm" className="w-full justify-start" tooltip="About ChirpSphere">
                                <Link href="#">
                                    About ChirpSphere
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size="sm" className="w-full justify-start" tooltip="Help">
                                <Link href="#">
                                    Help
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
         </div>
      </SidebarContent>
    </Sidebar>
  );
}
