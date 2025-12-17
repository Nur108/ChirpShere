'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters.')
    .max(21, 'Name must be 21 characters or less.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Name can only contain letters, numbers, and underscores.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
});

export default function CreateCommunityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  const communityName = form.watch('name');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    
    try {
        const slug = values.name.toLowerCase();
        await addDoc(collection(firestore, 'communities'), {
            name: values.name,
            slug: slug,
            description: values.description,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            memberCount: 1, // creator is the first member
            iconUrl: `https://picsum.photos/seed/${slug}/200/200`
        });

        toast({
            title: "Community Created!",
            description: `c/${slug} is now live.`,
        });
        router.push(`/c/${slug}`);
    } catch (error) {
        console.error("Error creating community: ", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request. The community name might already be taken.",
        });
    }
  }
  
  if (isUserLoading) {
      return <div>Loading...</div>
  }

  if (!user) {
      router.push('/login?redirect=/communities/create');
      return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create a Community</CardTitle>
          <CardDescription>Start your own space on ChirpSphere.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <p className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">c/</p>
                        <Input placeholder="communityname" className="pl-7" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      This will be the unique name for your community. No spaces or special characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about your community" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is how new members will learn about your community.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={!communityName || form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create Community"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
