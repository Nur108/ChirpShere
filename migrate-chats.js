// Migration script to update existing chat conversations to new format
// Run with: node migrate-chats.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account)
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   // or use service account key
// });

const db = admin.firestore();

async function migrateChats() {
  try {
    console.log('Starting chat migration...');
    
    const chatsSnapshot = await db.collection('chats').get();
    
    for (const doc of chatsSnapshot.docs) {
      const data = doc.data();
      
      // Check if this is old format (has userId, userName, userAvatar)
      if (data.userId && data.userName && data.userAvatar) {
        console.log(`Migrating conversation ${doc.id}...`);
        
        // Convert to new format
        const participants = data.participants || [data.userId]; // Assume current user is the other participant
        const participantNames = {};
        const participantAvatars = {};
        
        // Set up participant info
        participants.forEach(userId => {
          if (userId === data.userId) {
            participantNames[userId] = data.userName;
            participantAvatars[userId] = data.userAvatar || '';
          }
        });
        
        const updateData = {
          participantNames,
          participantAvatars,
          createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        };
        
        // Add unread counts for each participant
        participants.forEach(userId => {
          updateData[`unreadCount_${userId}`] = data.unreadCount || 0;
        });
        
        // Remove old fields
        const fieldsToDelete = ['userId', 'userName', 'userAvatar', 'unreadCount'];
        fieldsToDelete.forEach(field => {
          updateData[field] = admin.firestore.FieldValue.delete();
        });
        
        await doc.ref.update(updateData);
        console.log(`✅ Migrated conversation ${doc.id}`);
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Uncomment to run migration
// migrateChats();

module.exports = { migrateChats };