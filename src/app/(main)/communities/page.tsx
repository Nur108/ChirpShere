'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Community } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunitiesPage() {
    const firestore = useFirestore();

    const communitiesQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'communities'), orderBy('memberCount', 'desc')) : null,
        [firestore]
    );

    const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold font-headline">All Communities</h1>
                    <p className="text-muted-foreground">Discover new communities and find your people.</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            </div>
        )
    }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold font-headline">All Communities</h1>
        <p className="text-muted-foreground">Discover new communities and find your people.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {communities && communities.map((community) => (
          <Card key={community.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
              <Image src={community.iconUrl} alt={community.name} width={48} height={48} className="rounded-full" />
              <div>
                <CardTitle>{community.name}</CardTitle>
                <CardDescription>c/{community.slug}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">{community.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-sm font-semibold">{community.memberCount.toLocaleString()} members</span>
              <Button asChild>
                <Link href={`/c/${community.slug}`}>View</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
