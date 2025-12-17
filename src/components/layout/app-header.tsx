'use client';
import Link from 'next/link';
import { Search, MessageCircle, Bell, Plus, ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { signOut, getAuth } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useUser } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

function ChirpSphereLogo() {
    return (
        <Link href="/home" className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 8C14.5 9.5 12 10 12 10C12 10 9.5 9.5 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14C13.5 15.5 16 16 16 16C16 16 18.5 15.5 20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M4 14C5.5 15.5 8 16 8 16C8 16 10.5 15.5 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden md:inline-block text-xl font-bold font-headline">ChirpSphere</span>
        </Link>
    );
}

function UserMenu() {
    const { user, isUserLoading } = useUser();
    
    const handleLogout = async () => {
        await signOut(getAuth());
    };

    if (isUserLoading) {
        return <Skeleton className="h-8 w-24 rounded-full" />;
    }

    if (!user) {
        return (
            <div className="flex gap-2">
                <Button asChild variant="ghost">
                    <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-full p-1 h-auto">
                <Avatar className="h-8 w-8">
                    {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">{user.displayName || user.email}</span>
                <ChevronDown className="h-4 w-4 hidden lg:inline" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        <ChirpSphereLogo />
      </div>

      <div className="flex-1 mx-4">
        <form action="/search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Search ChirpSphere"
              className="w-full pl-10"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/c/general/submit">
                <Plus className="h-5 w-5" />
                <span className="sr-only">Create Post</span>
            </Link>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/messages">
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">Messages</span>
            </Link>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
