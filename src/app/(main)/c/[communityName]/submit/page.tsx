'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, where, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Text, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { use, useEffect, useState } from 'react';
import { Community } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  postType: z.enum(['text', 'image', 'link']),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
}).refine(data => {
    if (data.postType === 'image') return !!data.imageUrl && z.string().url().safeParse(data.imageUrl).success;
    if (data.postType === 'link') return !!data.linkUrl && z.string().url().safeParse(data.linkUrl).success;
    return true;
}, {
    message: 'Please provide a valid URL for the selected post type.',
    path: ['imageUrl'],
});

type PostFormValues = z.infer<typeof formSchema>;

export default function SubmitPage({ params }: { params: Promise<{ communityName: string }> }) {
  const { communityName } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);

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
        setCheckingMembership(false);
    }
    if (firestore) {
      getCommunity();
    }
  }, [firestore, communityName]);


  const form = useForm<PostFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      postType: 'text',
    },
  });
  
  const postType = form.watch('postType');

  async function onSubmit(values: PostFormValues) {
    if (!firestore || !user || !community) return;

    try {
        await addDoc(collection(firestore, 'posts'), {
            title: values.title,
            postType: values.postType,
            content: values.postType === 'link' ? values.linkUrl : values.content,
            imageUrl: values.postType === 'image' ? values.imageUrl : null,
            communityId: community.id,
            communitySlug: community.slug,
            communityIconUrl: community.iconUrl,
            authorId: user.uid,
            authorName: user.displayName || user.email,
            createdAt: serverTimestamp(),
            upvotes: 0,
            downvotes: 0,
            commentCount: 0,
        });

        toast({
            title: "Post Submitted!",
            description: "Your post has been successfully created.",
        });
        router.push(`/c/${communityName}`);

    } catch (error) {
        console.error("Error creating post: ", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
        });
    }
  }

  if (loadingCommunity || isUserLoading || checkingMembership) {
    return (
        <div className="max-w-3xl mx-auto">
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  if (!user) {
    router.push(`/login?redirect=/c/${communityName}/submit`);
    return null;
  }
  
  if (!isMember) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">You must be a member of this community to create posts.</p>
            <Button asChild>
              <Link href={`/c/${communityName}`}>Join Community</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!community) {
    // This case is handled by the notFound in useEffect, but as a fallback
    return <div>Community not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>Create a post in c/{community.name}</CardTitle>
                <CardDescription>Share your thoughts, images, or links with the community.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Tabs 
                        value={postType}
                        onValueChange={(value) => form.setValue('postType', value as 'text'|'image'|'link')}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="text"><Text className="mr-2 h-4 w-4"/>Text</TabsTrigger>
                            <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4"/>Image</TabsTrigger>
                            <TabsTrigger value="link"><LinkIcon className="mr-2 h-4 w-4"/>Link</TabsTrigger>
                        </TabsList>
                        
                        <div className="mt-6 space-y-8">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="An interesting title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <TabsContent value="text" forceMount className={postType !== 'text' ? 'hidden' : ''}>
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Body (optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Your post content..." {...field} rows={8} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                            <TabsContent value="image" forceMount className={postType !== 'image' ? 'hidden' : ''}>
                                <FormField
                                    control={form.control}
                                    name="imageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Image URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/image.png" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                            <TabsContent value="link" forceMount className={postType !== 'link' ? 'hidden' : ''}>
                                <FormField
                                    control={form.control}
                                    name="linkUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Submitting...' : 'Submit Post'}
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
