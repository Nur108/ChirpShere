const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
  // You can get this from your Firebase console
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateComments() {
  try {
    console.log('Starting comment migration...');
    
    // Get all comments from the old collection
    const commentsSnapshot = await getDocs(collection(db, 'comments'));
    const comments = [];
    
    commentsSnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${comments.length} comments to migrate`);
    
    // Group comments by postId
    const commentsByPost = {};
    comments.forEach(comment => {
      if (!commentsByPost[comment.postId]) {
        commentsByPost[comment.postId] = [];
      }
      commentsByPost[comment.postId].push(comment);
    });
    
    // Migrate comments to subcollections
    for (const [postId, postComments] of Object.entries(commentsByPost)) {
      console.log(`Migrating ${postComments.length} comments for post ${postId}`);
      
      const batch = writeBatch(db);
      
      postComments.forEach(comment => {
        const { postId: _, ...commentData } = comment; // Remove postId field
        const newCommentRef = doc(db, 'posts', postId, 'comments', comment.id);
        batch.set(newCommentRef, commentData);
      });
      
      await batch.commit();
      console.log(`✓ Migrated comments for post ${postId}`);
    }
    
    // Delete old comments collection
    console.log('Deleting old comments collection...');
    const deleteBatch = writeBatch(db);
    
    commentsSnapshot.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    
    await deleteBatch.commit();
    console.log('✓ Deleted old comments collection');
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateComments();