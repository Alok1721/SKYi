
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  const [examName, setExamName] = useState(localStorage.getItem('examName') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const savedExam = userData.examName || localStorage.getItem('examName') || '';
          setExamName(savedExam);
          localStorage.setItem('examName', savedExam);
        }
      } else {
        setExamName(localStorage.getItem('examName') || '');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ExamContext.Provider value={{ examName, setExamName, loading }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);
