import { doc, setDoc, getDoc, serverTimestamp, increment, writeBatch, Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';

export async function ensureUserInGeneralCommunity(firestore: Firestore, user: User) {
  try {
    // Check if user is already a member of general community
    const memberRef = doc(firestore, 'communities', 'general', 'members', user.uid);
    const memberDoc = await getDoc(memberRef);
    
    // If not a member, add them
    if (!memberDoc.exists()) {
      const batch = writeBatch(firestore);
      
      // Ensure user document exists
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        batch.set(userDocRef, {
          id: user.uid,
          username: (user.displayName || user.email?.split('@')[0] || 'user').toLowerCase(),
          email: user.email || '',
          createdAt: serverTimestamp(),
          avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
        });
      }
      
      // Add user to general community members
      batch.set(memberRef, {
        userId: user.uid,
        username: (user.displayName || user.email?.split('@')[0] || 'user').toLowerCase(),
        joinedAt: serverTimestamp(),
      });
      
      // Increment general community member count
      const communityRef = doc(firestore, 'communities', 'general');
      batch.update(communityRef, {
        memberCount: increment(1)
      });
      
      await batch.commit();
      console.log('User added to general community:', user.uid);
    }
  } catch (error) {
    console.error('Error ensuring user in general community:', error);
  }
}