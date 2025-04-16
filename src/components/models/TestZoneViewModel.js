import { auth, db } from "../../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { updateUserProgress } from "../../firebaseServices/update_user_progress";
import { submitQuizResult } from "../../firebaseServices/quiz_services";
import { formateQuestion } from "../../utils/textUtils";
import { formatTime } from "../../utils/date_time";

export class TestZoneViewModel {
  constructor(quizData, navigate) {
    this.quizData = quizData || {};
    this.navigate = navigate;
    this.quizId = quizData.quizId || "";
    this.questions = quizData.questions || [];
    this.isQuiz = quizData.isQuiz || false;
    this.quizMeta = quizData.quizData || {};
    this.collectionName = quizData.collectionName || "quizzes";
    this.collectionId = quizData.collectionId || "";
    this.groupMode = quizData.groupMode || false;
    this.currentUserId = auth.currentUser?.uid || "";
    this.allocatedTime = this.groupMode
      ? this.questions.length * 120
      : this.quizMeta.timeAllocated
      ? this.quizMeta.timeAllocated * 60
      : 180;

    // Initialize state
    this.state = {
      selectedOptions: this.loadFromLocalStorage("selectedOptions", {}),
      currentQuestionIndex: parseInt(this.loadFromLocalStorage("currentQuestionIndex", 0), 10),
      questionStatus: this.loadFromLocalStorage("questionStatus", {}),
      timeLeft: parseInt(this.loadFromLocalStorage("timeLeft", this.allocatedTime), 10),
      timePerQuestion: this.loadFromLocalStorage("timePerQuestion", {}),
      showWarning: false,
      isNavExpanded: true,
      lastSwitchTime: Date.now() / 1000,
      isSubmitting: false,
      error: null,
    };

    this.timer = null;
  }

  // LocalStorage helpers
  loadFromLocalStorage(key, defaultValue) {
    try {
      const saved = localStorage.getItem(`quiz_${this.quizId}_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(`quiz_${this.quizId}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  // State updates
  updateState(updates) {
    this.state = { ...this.state, ...updates };
    this.saveToLocalStorage("selectedOptions", this.state.selectedOptions);
    this.saveToLocalStorage("currentQuestionIndex", this.state.currentQuestionIndex);
    this.saveToLocalStorage("questionStatus", this.state.questionStatus);
    this.saveToLocalStorage("timeLeft", this.state.timeLeft);
    this.saveToLocalStorage("timePerQuestion", this.state.timePerQuestion);
    return this.state;
  }

  // Timer management
  startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.state.timeLeft <= 1) {
        clearInterval(this.timer);
        this.timer = null;
        this.calculateScore();
        return;
      }
      this.updateState({ timeLeft: this.state.timeLeft - 1 });
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Question navigation
  updateTimePerQuestion(newIndex) {
    try {
      const currentTime = Date.now() / 1000;
      const timeSpent = currentTime - this.state.lastSwitchTime;
      const updatedTimePerQuestion = {
        ...this.state.timePerQuestion,
        [this.state.currentQuestionIndex]: (this.state.timePerQuestion[this.state.currentQuestionIndex] || 0) + timeSpent,
      };
      this.updateState({
        timePerQuestion: updatedTimePerQuestion,
        lastSwitchTime: currentTime,
        currentQuestionIndex: newIndex,
      });
    } catch (error) {
      console.error("Error updating time per question:", error);
      this.updateState({ error: "Failed to update question time." });
    }
  }

  // User actions
  handleOptionClick(option) {
    this.updateState({
      showWarning: false,
      selectedOptions: {
        ...this.state.selectedOptions,
        [this.state.currentQuestionIndex]:
          this.state.selectedOptions[this.state.currentQuestionIndex] === option ? null : option,
      },
    });
  }

  handleSkip() {
    this.updateState({
      showWarning: false,
      questionStatus: {
        ...this.state.questionStatus,
        [this.state.currentQuestionIndex]: "skipped",
      },
    });
    if (this.state.currentQuestionIndex < this.questions.length - 1) {
      this.updateTimePerQuestion(this.state.currentQuestionIndex + 1);
    }
  }

  handleSaveNext() {
    if (this.isQuiz && !this.state.selectedOptions[this.state.currentQuestionIndex]) {
      this.updateState({ showWarning: true });
      return;
    }
    this.updateState({
      showWarning: false,
      questionStatus: {
        ...this.state.questionStatus,
        [this.state.currentQuestionIndex]: "attempted",
      },
    });
    if (this.state.currentQuestionIndex < this.questions.length - 1) {
      this.updateTimePerQuestion(this.state.currentQuestionIndex + 1);
    }
  }

  toggleNav() {
    this.updateState({ isNavExpanded: !this.state.isNavExpanded });
  }

  // Score calculation and submission
  async calculateScore() {
    if (!this.quizId) {
      console.error("Quiz ID is missing.");
      this.updateState({ error: "Quiz ID is missing." });
      return;
    }

    this.updateState({ isSubmitting: true });
    try {
      // Update time for the last question
      const currentTime = Date.now() / 1000;
      const updatedTimePerQuestion = {
        ...this.state.timePerQuestion,
        [this.state.currentQuestionIndex]:
          (this.state.timePerQuestion[this.state.currentQuestionIndex] || 0) + (currentTime - this.state.lastSwitchTime),
      };
      this.updateState({ timePerQuestion: updatedTimePerQuestion });

      const totalQuestions = this.questions.length;
      let totalScore = 0;
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let totalViewed = Object.keys(this.state.selectedOptions).length;
      const totalTimeTaken = this.allocatedTime - this.state.timeLeft;
      const totalSkipped = Object.values(this.state.questionStatus).filter((status) => status === "skipped").length;
      const totalAttempted = Object.values(this.state.questionStatus).filter((status) => status === "attempted").length;
      const averageTimePerQuestion = totalTimeTaken / (totalViewed || totalQuestions);

      const updatedQuestionStatus = await Promise.all(
        this.questions.map(async (question, index) => {
          const userAnswer = this.state.selectedOptions[index];
          const isAttempted = userAnswer !== undefined && userAnswer !== null;
          const isCorrect = isAttempted && question.correctOption ? userAnswer === question.correctOption : false;

          if (this.groupMode && question.id) {
            try {
              const questionRef = doc(db, "questions", question.id);
              const updateData = {
                youAnswer: userAnswer || "Not Attempted",
                isCorrect,
              };
              if (isAttempted) {
                updateData.solvedBy = arrayUnion(this.currentUserId);
              }
              await updateDoc(questionRef, updateData);
            } catch (error) {
              console.error(`Error updating question ${question.id}:`, error);
            }
          } else if (!this.isQuiz) {
            return {
              ...question,
              yourAnswer: question.correctOption,
              isCorrect: true,
              isAttempted: true,
              timeSpent: updatedTimePerQuestion[index] || 0,
            };
          }

          if (isCorrect) {
            totalScore += 3;
            totalCorrect++;
          } else if (isAttempted) {
            totalScore -= 1;
            totalIncorrect++;
          }

          return {
            ...question,
            yourAnswer: userAnswer || "Not Attempted",
            isCorrect,
            isAttempted,
            timeSpent: updatedTimePerQuestion[index] || 0,
          };
        })
      );

      const correctPercentage = (totalCorrect / totalQuestions) * 100;

      // Update user progress
      await this.updateUserProgress(correctPercentage);

      // Update quiz data in Firestore
      if (this.groupMode) {
        // No quiz update needed in group mode
      } else if (this.collectionName === "quizzes") {
        const quizRef = doc(db, this.collectionName, this.collectionId);
        await updateDoc(quizRef, {
          questions: updatedQuestionStatus,
          totalScore,
          correctPercentage,
          quizStatus: true,
          totalQuestions,
          solvedBy: arrayUnion(this.currentUserId),
        });
      } else {
        const questionRef = doc(db, this.collectionName, this.collectionId);
        await updateDoc(questionRef, {
          youAnswer: this.state.selectedOptions[this.state.currentQuestionIndex],
          isCorrect: updatedQuestionStatus[this.state.currentQuestionIndex].isCorrect,
          solvedBy: arrayUnion(this.currentUserId),
        });
      }

      // Clear localStorage
      this.clearLocalStorage();

      // Prepare quiz result
      const quizResult = {
        score: totalScore,
        totalCorrect,
        totalIncorrect,
        correctPercentage,
        totalQuestions,
        questions: updatedQuestionStatus,
        totalTimeTaken,
        totalViewed,
        totalSkipped,
        totalAttempted,
        averageTimePerQuestion,
        timePerQuestion: updatedTimePerQuestion,
        collectionName: this.collectionName,
        totalTimeAllocated: this.allocatedTime,
        isGroupMode: this.groupMode,
      };

      // Submit quiz result
      if (!this.groupMode) {
        const success = await submitQuizResult(this.quizId, quizResult);
        if (!success) {
          throw new Error("Failed to submit quiz result.");
        }
      }

      // Navigate to result
      this.navigate("/quizResult", { state: quizResult });
    } catch (error) {
      console.error("Error calculating score:", error);
      this.updateState({ error: "Failed to submit quiz. Please try again." });
    } finally {
      this.updateState({ isSubmitting: false });
    }
  }

  async updateUserProgress(correctPercentage) {
    if (!this.currentUserId) return;
    try {
      const createdAt = this.quizMeta.createdAt?.toDate ? this.quizMeta.createdAt.toDate() : new Date();
      const subject = this.groupMode
        ? "Practise"
        : this.collectionName === "quizzes"
        ? this.quizMeta.subject
        : this.questions[0]?.subject || "Mixed";
      await updateUserProgress(this.currentUserId, correctPercentage, subject, createdAt);
    } catch (error) {
      console.error("Error updating user progress:", error);
    }
  }

  clearLocalStorage() {
    try {
      localStorage.removeItem(`quiz_${this.quizId}_selectedOptions`);
      localStorage.removeItem(`quiz_${this.quizId}_currentQuestionIndex`);
      localStorage.removeItem(`quiz_${this.quizId}_questionStatus`);
      localStorage.removeItem(`quiz_${this.quizId}_timeLeft`);
      localStorage.removeItem(`quiz_${this.quizId}_timePerQuestion`);
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }

  // Utility functions
  formatTime(seconds) {
    return formatTime(seconds);
  }

  formatQuestion(text) {
    return formateQuestion(text);
  }

  getCurrentQuestion() {
    const question = this.questions[this.state.currentQuestionIndex] || {};
    return {
      ...question,
      questionText: question.question?.trim() || question.questionImage?.trim() ? question.question : "No question available",
      options: question.options?.some((opt) => opt.trim() !== "") ? question.options : ["1", "2", "3", "4"],
    };
  }
}