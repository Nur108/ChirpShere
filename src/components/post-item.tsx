import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { type Post } from '@/lib/types';
import { VoteButtons } from './vote-buttons';
import { cn } from '@/lib/utils';

interface PostItemProps {
  post: Post;
  isCompact?: boolean;
}

export function PostItem({ post, isCompact = false }: PostItemProps) {
  const postUrl = `/c/${post.communitySlug}/posts/${post.id}`;
  const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="flex">
        <div className="hidden md:flex flex-col items-center p-2 bg-muted/50">
          <VoteButtons initialUpvotes={post.upvotes} initialDownvotes={post.downvotes} postId={post.id} />
        </div>
        <div className="flex-1">
          <CardHeader className="p-4">
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
            <CardTitle className={cn("text-lg", !isCompact && "md:text-xl")}>
              <Link href={postUrl} className="hover:underline">
                {post.title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {post.postType === 'image' && post.imageUrl && (
              <div className="relative mt-2 max-h-[400px] overflow-hidden rounded-md border">
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
              <p className="text-sm text-foreground/80 max-h-[100px] overflow-hidden mask-image-b">
                {post.content}
              </p>
            )}
            {post.postType === 'link' && (
              <a href={post.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-4 bg-muted rounded-md hover:bg-muted/80">
                <LinkIcon className="h-5 w-5" />
                <span className="text-sm truncate">{post.content}</span>
              </a>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0">
             <div className="flex items-center gap-4">
              <div className="md:hidden">
                <VoteButtons initialUpvotes={post.upvotes} initialDownvotes={post.downvotes} postId={post.id} />
              </div>
              <Button variant="ghost" asChild>
                <Link href={postUrl}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {post.commentCount} Comments
                </Link>
              </Button>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

const styles = `
.mask-image-b {
  mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
}
`
// A trick to add styles that are hard to do with tailwind
export function PostItemStyle() {
  return <style>{styles}</style>;
}
