import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Post Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/home">Go to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
