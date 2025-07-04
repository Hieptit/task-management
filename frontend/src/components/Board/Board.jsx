import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axiosInstance from '../../config/axios';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { useNavigate, useParams } from 'react-router-dom';

const BoardContainer = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: #f5f6fa;
`;

const BoardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
`;

const BoardTitle = styled.h1`
  font-size: 24px;
  color: #333;
  margin: 0;
`;

const EditIcon = styled.span`
  cursor: pointer;
  font-size: 18px;
  color: #666;
`;

const BoardDescription = styled.p`
  color: #666;
  margin: 5px 0 20px;
`;

const TaskList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const AddTaskButton = styled.button`
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background: #5f50e1;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const ErrorContainer = styled.div`
  color: #ff4444;
  text-align: center;
  padding: 20px;
  background: #ffe6e6;
  border-radius: 10px;
  margin: 20px 0;
`;

const RetryButton = styled.button`
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  margin-top: 10px;
  cursor: pointer;
  
  &:hover {
    background: #5f50e1;
  }
`;

const TaskForm = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
  min-height: 100px;
`;

const Button = styled.button`
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
  
  &:hover {
    background: #5f50e1;
  }
`;

const Board = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boardName, setBoardName] = useState('My Task Board');
  const [boardDescription, setBoardDescription] = useState('Tasks to keep organised');
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', description: '' });
  const navigate = useNavigate();
  const { boardId } = useParams();

  useEffect(() => {
    console.log('Board component mounted with boardId:', boardId);
    if (!boardId) {
      createNewBoard();
    } else {
      fetchBoard();
    }
  }, [boardId]);

  const createNewBoard = async () => {
    console.log('Creating new board...');
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/');
        return;
      }

      const response = await axiosInstance.post('/boards');
      
      console.log('New board created:', response.data);
      if (response.data && response.data.boardId) {
        localStorage.setItem('boardId', response.data.boardId);
        navigate(`/board/${response.data.boardId}`);
      } else {
        setError('Invalid board data received');
        setLoading(false);
      }
    } catch (err) {
      console.error('Board creation error:', err);
      handleError(err);
    }
  };

  const fetchBoard = async () => {
    console.log('Fetching board data...');
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found, redirecting to login');
        navigate('/');
        return;
      }

      const response = await axiosInstance.get(`/boards/${boardId}`);
      console.log('Board data received:', response.data);
      
      if (response.data) {
        setBoardName(response.data.name);
        setBoardDescription(response.data.description);
        setTasks(response.data.tasks || []);
        setError(null);
      } else {
        setError('Invalid board data received');
      }
    } catch (err) {
      console.error('Board fetch error:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      navigate('/');
    } else {
      setError(err.response?.data?.message || 'An error occurred');
    }
    setLoading(false);
  };

  const handleBoardUpdate = async () => {
    try {
      await axiosInstance.put(`/boards/${boardId}`, {
        name: boardName,
        description: boardDescription
      });
      setIsEditingBoard(false);
      setError(null);
    } catch (err) {
      console.error('Board update error:', err);
      handleError(err);
    }
  };

  const handleTaskUpdate = async (updatedTask) => {
    try {
      const response = await axiosInstance.put(`/tasks/${updatedTask.id}`, updatedTask);
      const updatedTaskData = response.data;
      setTasks(tasks.map(task => 
        task.id === updatedTaskData.id ? updatedTaskData : task
      ));
      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Task update error:', err);
      handleError(err);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await axiosInstance.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Task deletion error:', err);
      handleError(err);
    }
  };

  const handleAddTask = async () => {
    try {
      const response = await axiosInstance.post(`/boards/${boardId}/tasks`, {
        name: newTask.name,
        description: newTask.description,
        status: 'in-progress',
        icon: '📝'
      });
      
      setTasks([...tasks, response.data]);
      setIsAddingTask(false);
      setNewTask({ name: '', description: '' });
      setError(null);
    } catch (err) {
      console.error('Task creation error:', err);
      handleError(err);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchBoard();
  };

  if (loading) {
    return (
      <BoardContainer>
        <LoadingSpinner>Loading tasks...</LoadingSpinner>
      </BoardContainer>
    );
  }

  if (error) {
    return (
      <BoardContainer>
        <ErrorContainer>
          <h3>Error loading board</h3>
          <p>{error}</p>
          <RetryButton onClick={handleRetry}>
            Try Again
          </RetryButton>
        </ErrorContainer>
      </BoardContainer>
    );
  }

  return (
    <BoardContainer>
      <BoardHeader>
        <img src="/board-icon.png" alt="Board" />
        {isEditingBoard ? (
          <>
            <input
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              style={{ fontSize: '24px', padding: '5px' }}
            />
            <button onClick={handleBoardUpdate}>Save</button>
            <button onClick={() => setIsEditingBoard(false)}>Cancel</button>
          </>
        ) : (
          <>
            <BoardTitle>{boardName}</BoardTitle>
            <EditIcon onClick={() => setIsEditingBoard(true)}>✏️</EditIcon>
          </>
        )}
        <AddTaskButton onClick={() => {
          setSelectedTask({
            id: null,
            name: '',
            description: '',
            status: 'in-progress',
            icon: '📝'
          });
          setIsModalOpen(true);
        }}>Add New Task</AddTaskButton>
      </BoardHeader>
      
      {isEditingBoard ? (
        <textarea
          value={boardDescription}
          onChange={(e) => setBoardDescription(e.target.value)}
          style={{ width: '100%', margin: '10px 0', padding: '5px' }}
        />
      ) : (
        <BoardDescription>{boardDescription}</BoardDescription>
      )}
      
      <TaskList>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => handleTaskClick(task)}
          />
        ))}
      </TaskList>

      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </BoardContainer>
  );
};

export default Board; 