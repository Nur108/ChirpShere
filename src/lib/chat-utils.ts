import { Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

export function generateConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

export async function createOrGetConversation(
  firestore: Firestore,
  currentUser: User,
  otherUserId: string,
  otherUserName: string,
  otherUserAvatar: string
) {
  const conversationId = generateConversationId(currentUser.uid, otherUserId);
  const conversationRef = doc(firestore, 'chats', conversationId);
  
  const conversationDoc = await getDoc(conversationRef);
  
  if (!conversationDoc.exists()) {
    await setDoc(conversationRef, {
      participants: [currentUser.uid, otherUserId],
      participantNames: {
        [currentUser.uid]: currentUser.displayName || currentUser.email || 'Unknown',
        [otherUserId]: otherUserName,
      },
      participantAvatars: {
        [currentUser.uid]: currentUser.photoURL || '',
        [otherUserId]: otherUserAvatar,
      },
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSenderId: '',
      [`unreadCount_${currentUser.uid}`]: 0,
      [`unreadCount_${otherUserId}`]: 0,
      createdAt: serverTimestamp(),
    });
  }
  
  return conversationId;
}

export async function markMessagesAsRead(
  firestore: Firestore,
  conversationId: string,
  userId: string
) {
  const conversationRef = doc(firestore, 'chats', conversationId);
  await setDoc(conversationRef, {
    [`unreadCount_${userId}`]: 0,
  }, { merge: true });
}