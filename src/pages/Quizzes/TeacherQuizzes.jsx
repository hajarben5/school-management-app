import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import QuizCardTeacher from './components/QuizCardTeacher';
import QuizForm from './components/QuizForm';
import { BASE_URL } from './utils/quizUtils';
import Pagination from './components/Pagination';
import { PageHeader } from '../../components';

const TeacherQuizzes = () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setApiCourses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [editingQuiz, setEditingQuiz] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const quizzesPerPage = 8;

  useEffect(() => {
    fetchQuizzes();
    fetchApiCourses();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/quizzes`);
      const data = await response.json();
      const quizzesWithUniqueIds = data.map((quiz, index) => ({
        ...quiz,
        id: quiz.id || `quiz-${Date.now()}-${index}`,
      }));
      setQuizzes(quizzesWithUniqueIds);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchApiCourses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/courses`);
      const data = await response.json();
      setApiCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleDelete = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        const response = await fetch(`${BASE_URL}/quizzes/${quizId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete quiz');
        }
        setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
      } catch (error) {
        console.error('Error deleting quiz:', error);
      }
    }
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setIsEditModalOpen(true);
  };

  const handleUpdateQuiz = async (updatedQuiz) => {
    try {
      const response = await fetch(`${BASE_URL}/quizzes/${updatedQuiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedQuiz),
      });

      if (!response.ok) {
        throw new Error('Failed to update quiz');
      }

      const updatedQuizData = await response.json();
      setQuizzes(quizzes.map((quiz) => (quiz.id === updatedQuizData.id ? updatedQuizData : quiz)));
      setIsEditModalOpen(false);
      setEditingQuiz(null);
    } catch (error) {
      console.error('Error updating quiz:', error);
    }
  };

  const handleViewDetails = (quizId) => {
    window.location.href = `/quizzes/questions/${quizId}`;
  };

  const handleAddQuestions = (quizId) => {
    window.location.href = `/quizzes/all-questions/${quizId}`;
  };

  const handleAddQuiz = async (newQuiz) => {
    try {
      const response = await fetch(`${BASE_URL}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuiz),
      });

      if (!response.ok) {
        throw new Error('Failed to add quiz');
      }

      const addedQuiz = await response.json();
      setQuizzes([...quizzes, addedQuiz]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding quiz:', error);
    }
  };

  const filteredQuizzes = selectedCourse
    ? quizzes.filter((quiz) => quiz.coursequizID === selectedCourse)
    : quizzes;

  const indexOfLastQuiz = currentPage * quizzesPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
  const currentQuizzes = filteredQuizzes.slice(indexOfFirstQuiz, indexOfLastQuiz);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto">
      <PageHeader title="Quizzes" />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="select select-bordered w-full max-w"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.coursequizID} value={course.coursequizID}>
                {course.courseName}
              </option>
            ))}
          </select>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-wide btn-primary">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add Quiz
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {currentQuizzes.map((quiz, index) => (
          <div key={`quiz-card-${quiz.id}-${index}`}>
            <QuizCardTeacher
              quiz={quiz}
              onDelete={() => handleDelete(quiz.id)}
              onEdit={() => handleEdit(quiz)}
              onViewDetails={() => handleViewDetails(quiz.id)}
              onAddQuestions={() => handleAddQuestions(quiz.id)}
            />
          </div>
        ))}
      </div>

      {/* Pagination  */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredQuizzes.length / quizzesPerPage)}
        onPrevious={() => paginate(currentPage - 1)}
        onNext={() => paginate(currentPage + 1)}
      />

      {isAddModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add New Quiz</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="btn btn-ghost btn-circle">
                <X size={24} />
              </button>
            </div>
            <QuizForm
              courses={courses}
              onSubmit={handleAddQuiz}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      )}

      {isEditModalOpen && editingQuiz && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Quiz</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="btn btn-ghost btn-circle"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <QuizForm
              initialQuiz={editingQuiz}
              courses={courses}
              onSubmit={handleUpdateQuiz}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherQuizzes;
