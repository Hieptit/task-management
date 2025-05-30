import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const BoardListContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  color: #333;
  margin: 0;
`;

const CreateBoardButton = styled.button`
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5f50e1;
  }
`;

const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const BoardCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
`;

const BoardName = styled.h2`
  font-size: 20px;
  color: #333;
  margin: 0 0 10px 0;
`;

const BoardDescription = styled.p`
  color: #666;
  margin: 0 0 15px 0;
  font-size: 14px;
`;

const TaskCount = styled.div`
  color: #6c5ce7;
  font-size: 14px;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  padding: 20px;
  background: #ffe6e6;
  border-radius: 10px;
  margin: 20px 0;
`;

const BoardList = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/');
        return;
      }

      const apiUrl = 'http://45.77.172.27:5001';
      const response = await axios.get(`${apiUrl}/api/boards`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setBoards(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching boards:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('accessToken');
        navigate('/');
      } else {
        setError(err.response?.data?.message || 'Failed to load boards');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/');
        return;
      }

      const apiUrl = 'http://45.77.172.27:5001';
      const response = await axios.post(`${apiUrl}/api/boards`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.boardId) {
        navigate(`/board/${response.data.boardId}`);
      }
    } catch (err) {
      console.error('Error creating board:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('accessToken');
        navigate('/');
      } else {
        setError(err.response?.data?.message || 'Failed to create board');
      }
    }
  };

  if (loading) {
    return (
      <BoardListContainer>
        <LoadingSpinner>Loading boards...</LoadingSpinner>
      </BoardListContainer>
    );
  }

  if (error) {
    return (
      <BoardListContainer>
        <ErrorMessage>
          <h3>Error loading boards</h3>
          <p>{error}</p>
        </ErrorMessage>
      </BoardListContainer>
    );
  }

  return (
    <BoardListContainer>
      <Header>
        <Title>My Boards</Title>
        <CreateBoardButton onClick={handleCreateBoard}>
          Create New Board
        </CreateBoardButton>
      </Header>

      <BoardGrid>
        {boards.map(board => (
          <BoardCard
            key={board.id}
            onClick={() => navigate(`/board/${board.id}`)}
          >
            <BoardName>{board.name}</BoardName>
            <BoardDescription>{board.description}</BoardDescription>
            <TaskCount>{board.taskCount} tasks</TaskCount>
          </BoardCard>
        ))}
      </BoardGrid>
    </BoardListContainer>
  );
};

export default BoardList; 