
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../firebaseServices/current_user';
import { collection, getDocs, writeBatch, doc, setDoc,getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../styles/adminExamMigration.css';
import WithAdminHeader from '../components/layout/WithAdminHeader';

const AdminExamMigration = () => {
  const navigate = useNavigate();
  const [migrationStatus, setMigrationStatus] = useState('idle');
  const [migrationMessage, setMigrationMessage] = useState('');
  const [error, setError] = useState(null);

  const batchUpdate = async (collectionName, batchSize = 500) => {
    const ref = collection(db, collectionName);
    const snapshot = await getDocs(ref);
    let batch = writeBatch(db);
    let count = 0;
    let updated = 0;

    for (const docSnap of snapshot.docs) {
      batch.update(doc(db, collectionName, docSnap.id), { examName: 'UPSC' });
      count++;
      updated++;
      if (count >= batchSize) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) await batch.commit();
    return updated;
  };

  const migrateUserProgress = async () => {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    let updated = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const progressRef = doc(db, 'user_progress', userId);
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        const progressData = progressSnap.data();
        const batch = writeBatch(db);

        // Create UPSC subcollection for each date
        for (const [date, data] of Object.entries(progressData)) {
          const upscProgressRef = doc(db, `user_progress/${userId}/UPSC`, date);
          batch.set(upscProgressRef, {
            completedPOD: data.completedPOD || false,
            correctPercentage: data.correctPercentage || 0,
            examName: 'UPSC'
          });
        }

        // Commit batch for this user
        await batch.commit();
        updated++;
      }
    }

    return updated;
  };

  const runMigration = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.isAdmin) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      setMigrationStatus('running');
      setMigrationMessage('Starting migration...');
      setError(null);

      const playlistsUpdated = await batchUpdate('playlists');
      setMigrationMessage(`Updated ${playlistsUpdated} playlists.`);

      const questionProgressUpdated = await batchUpdate('question_progress');
      setMigrationMessage(`Updated ${playlistsUpdated} playlists and ${questionProgressUpdated} question progress records.`);

      const questionsUpdated = await batchUpdate('questions');
      setMigrationMessage(`Updated ${playlistsUpdated} playlists, ${questionProgressUpdated} question progress records, and ${questionsUpdated} questions.`);

      const quizzesUpdated = await batchUpdate('quizzes');
      setMigrationMessage(`Updated ${playlistsUpdated} playlists, ${questionProgressUpdated} question progress records, ${questionsUpdated} questions, and ${quizzesUpdated} quizzes.`);

      const submissionsUpdated = await batchUpdate('submissions');
      setMigrationMessage(`Updated ${playlistsUpdated} playlists, ${questionProgressUpdated} question progress records, ${questionsUpdated} questions, ${quizzesUpdated} quizzes, and ${submissionsUpdated} submissions.`);

      const usersUpdated = await batchUpdate('users');
      setMigrationMessage(`Updated ${playlistsUpdated} playlists, ${questionProgressUpdated} question progress records, ${questionsUpdated} questions, ${quizzesUpdated} quizzes, ${submissionsUpdated} submissions, and ${usersUpdated} users.`);

      const userProgressUpdated = await migrateUserProgress();
      setMigrationStatus('completed');
      setMigrationMessage(
        `Migration completed: Updated ${playlistsUpdated} playlists, ${questionProgressUpdated} question progress records, ${questionsUpdated} questions, ${quizzesUpdated} quizzes, ${submissionsUpdated} submissions, ${usersUpdated} users, and ${userProgressUpdated} user progress records.`
      );
    } catch (err) {
      setMigrationStatus('failed');
      setError(`Migration failed: ${err.message}`);
      setMigrationMessage('');
      console.error('Migration error:', err);
    }
  };

  return (
    <div className="admin-exam-migration">
      <h1>Exam Name Migration</h1>
      <p>
        This tool will add <code>examName: "UPSC"</code> to all documents in the
        <code>playlists</code>, <code>question_progress</code>, <code>questions</code>,
        <code>quizzes</code>, <code>submissions</code>, and <code>users</code> collections,
        and restructure <code>user_progress</code> with exam-specific subcollections.
      </p>
      {error && <div className="error-message">{error}</div>}
      <button
        onClick={runMigration}
        disabled={migrationStatus === 'running' || migrationStatus === 'completed'}
        className="migration-button"
      >
        {migrationStatus === 'running' ? 'Migrating...' : 'Run Migration'}
      </button>
      {migrationMessage && <div className="migration-message">{migrationMessage}</div>}
      {migrationStatus === 'completed' && (
        <button onClick={() => navigate('/adminDashboard')} className="back-button">
          Back to Admin Dashboard
        </button>
      )}
    </div>
  );
};

export default WithAdminHeader(AdminExamMigration, 'Exam Migration');
