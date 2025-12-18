'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export function MessagingDiagnostics() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setDiagnostics(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    
    try {
      // Test 1: Firebase connection
      addLog('Testing Firebase connection...');
      if (!firestore) {
        addLog('❌ Firestore not initialized');
        return;
      }
      addLog('✅ Firestore initialized');

      // Test 2: User authentication
      addLog('Testing user authentication...');
      if (isUserLoading) {
        addLog('⏳ User loading...');
        return;
      }
      if (!user) {
        addLog('❌ User not authenticated');
        return;
      }
      addLog(`✅ User authenticated: ${user.email}`);

      // Test 3: Read comments collection
      addLog('Testing comments collection read...');
      const commentsRef = collection(firestore, 'comments');
      const snapshot = await getDocs(commentsRef);
      addLog(`✅ Comments collection accessible, ${snapshot.size} documents found`);

      // Test 4: Write test comment
      addLog('Testing comment write...');
      const testComment = {
        content: 'Test comment from diagnostics',
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorAvatarUrl: user.photoURL,
        postId: 'test-post-id',
        parentId: null,
        createdAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
      };
      
      await addDoc(commentsRef, testComment);
      addLog('✅ Test comment written successfully');

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Diagnostics error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-4">Messaging System Diagnostics</h3>
      
      <button 
        onClick={runDiagnostics}
        disabled={isRunning}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isRunning ? 'Running...' : 'Run Diagnostics'}
      </button>

      <div className="space-y-1 font-mono text-sm max-h-60 overflow-y-auto">
        {diagnostics.map((log, index) => (
          <div key={index} className="text-xs">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}