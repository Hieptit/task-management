import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Board from './components/Board/Board';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f5f6fa;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra token khi ứng dụng khởi động
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const boardId = localStorage.getItem('boardId');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const apiUrl = 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/auth/validate`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Token validation failed');
        }

        setIsAuthenticated(true);
        // Nếu không có boardId, tạo board mới
        if (!boardId) {
          try {
            const createBoardResponse = await fetch(`${apiUrl}/api/boards`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!createBoardResponse.ok) {
              throw new Error('Failed to create board');
            }
            
            const data = await createBoardResponse.json();
            if (data && data.boardId) {
              localStorage.setItem('boardId', data.boardId);
            }
          } catch (error) {
            console.error('Error creating board:', error);
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('boardId');
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    validateToken();
  }, []);

  if (isLoading) {
    return (
      <LoadingContainer>
        <div className="spinner"></div>
      </LoadingContainer>
    );
  }

  return (
    <AppContainer>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/board" /> : <Login setAuth={setIsAuthenticated} />} 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/board" /> : <SignUp setAuth={setIsAuthenticated} />} 
          />
          <Route 
            path="/board" 
            element={isAuthenticated ? <Board /> : <Navigate to="/" />} 
          />
          <Route 
            path="/board/:boardId" 
            element={isAuthenticated ? <Board /> : <Navigate to="/" />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AppContainer>
  );
};

export default App;
