import { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl: string;
  createdAt: Timestamp;
};

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  ownerId: string;
  createdAt: Timestamp;
  memberCount: number;
};

export type Post = {
  id: string;
  title: string;
  postType: 'text' | 'image' | 'link';
  content: string; // For text post content or link URL
  imageUrl?: string; // For image post
  communityId: string;
  authorId: string;
  createdAt: Timestamp;
  upvotes: number;
  downvotes: number;
  commentCount: number;

  // Denormalized data
  authorName: string;
  communitySlug: string;
  communityIconUrl?: string;
};

export type Comment = {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentId?: string | null;
  createdAt: Timestamp;
  upvotes: number;
  downvotes: number;
  
  // Denormalized
  authorName: string;
  authorAvatarUrl: string;
};


export type ChatMessage = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Timestamp;
  isRead: boolean;
};

export type ChatConversation = {
  id: string; // combination of user ids
  participants: string[];
  // Denormalized from the other user's profile
  userId: string;
  userName: string;
  userAvatar: string;
  // Last message info
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  lastMessageSenderId: string;
  //
  unreadCount: number;
};
