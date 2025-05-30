import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
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
  margin-bottom: 30px;
  gap: 10px;

  img {
    width: 32px;
    height: 32px;
  }
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
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const AddTaskButton = styled.div`
  background: #fff3e0;
  padding: 15px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:hover {
    background: #ffe0b2;
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

const Board = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boardName, setBoardName] = useState('My Task Board');
  const [boardDescription, setBoardDescription] = useState('Tasks to keep organised');
  const [isEditingBoard, setIsEditingBoard] = useState(false);
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
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/');
        return;
      }

      const apiUrl = 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/boards`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

      const apiUrl = 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/boards/${boardId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Board data received:', response.data);
      if (response.data) {
        setTasks(response.data.tasks || []);
        setBoardName(response.data.name || 'My Task Board');
        setBoardDescription(response.data.description || 'Tasks to keep organised');
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
      console.log('Authentication error, redirecting to login');
      navigate('/');
    } else {
      setError(err.response?.data?.message || 'Failed to load board');
      setLoading(false);
    }
  };

  const handleBoardUpdate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${process.env.REACT_APP_API_URL}/api/boards/${boardId}`, {
        name: boardName,
        description: boardDescription
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('accessToken');
      if (updatedTask.id) {
        const apiUrl = 'http://localhost:5000';
        await axios.put(`${apiUrl}/api/tasks/${updatedTask.id}`, updatedTask, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      await fetchBoard();
      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Task update error:', err);
      handleError(err);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = 'http://localhost:5000';
      await axios.delete(`${apiUrl}/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchBoard();
      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Task deletion error:', err);
      handleError(err);
    }
  };

  const handleAddTask = async () => {
    const newTask = {
      name: 'New Task',
      description: '',
      status: 'in-progress',
      icon: '📝'
    };

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/boards/${boardId}/tasks`, newTask, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const createdTask = response.data;
      setSelectedTask(createdTask);
      setIsModalOpen(true);
      await fetchBoard();
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
        
        <AddTaskButton onClick={handleAddTask}>
          <span>➕</span>
          Add new task
        </AddTaskButton>
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