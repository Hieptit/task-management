import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { useNavigate } from 'react-router-dom';

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

  const boardId = localStorage.getItem('boardId');

  useEffect(() => {
    if (!boardId) {
      // Nếu không có boardId, tạo board mới
      const createNewBoard = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/');
            return;
          }

          const apiUrl = 'http://localhost:5000';
          const response = await axios.post(`${apiUrl}/api/boards`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data && response.data.boardId) {
            localStorage.setItem('boardId', response.data.boardId);
            navigate(`/board/${response.data.boardId}`);
          } else {
            setError('Invalid board data received');
            setLoading(false);
          }
        } catch (err) {
          console.error('Board creation error:', err);
          if (err.response?.status === 401) {
            navigate('/');
          } else {
            setError(err.response?.data?.message || 'Failed to create board');
            setLoading(false);
          }
        }
      };
      createNewBoard();
    } else {
      fetchBoard();
    }
  }, [boardId, navigate]);

  // Fetch board and tasks from backend
  const fetchBoard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const apiUrl = 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/boards/${boardId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        setTasks(response.data.tasks || []);
        setBoardName(response.data.name || 'My Task Board');
        setBoardDescription(response.data.description || 'Tasks to keep organised');
        setLoading(false);
      } else {
        setError('Invalid board data received');
        setLoading(false);
      }
    } catch (err) {
      console.error('Board fetch error:', err);
      if (err.response?.status === 401) {
        navigate('/');
      } else {
        setError(err.response?.data?.message || 'Failed to load board');
        setLoading(false);
      }
    }
  };

  const handleBoardUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.REACT_APP_API_URL}/api/boards/${boardId}`, {
        name: boardName,
        description: boardDescription
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsEditingBoard(false);
    } catch (err) {
      setError('Failed to update board');
    }
  };

  const handleTaskUpdate = async (updatedTask) => {
    try {
      const token = localStorage.getItem('token');
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
    } catch (err) {
      console.error('Task update error:', err);
      setError('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:5000';
      await axios.delete(`${apiUrl}/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchBoard();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Task deletion error:', err);
      setError('Failed to delete task');
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
      const token = localStorage.getItem('token');
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
    } catch (err) {
      console.error('Task creation error:', err);
      setError('Failed to create task');
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
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
        <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
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

      {error && (
        <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </BoardContainer>
  );
};

export default Board; 