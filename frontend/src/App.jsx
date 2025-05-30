import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  color: #ff4444;
  text-align: center;
  padding: 20px;
`;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        async (config) => {
          const accessToken = localStorage.getItem('accessToken');
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              const refreshToken = localStorage.getItem('refreshToken');
              if (!refreshToken) {
                throw new Error('No refresh token available');
              }

              const apiUrl = 'http://45.77.172.27:5001';
              const response = await axios.post(`${apiUrl}/api/auth/refresh`, {
                refreshToken
              });

              const { accessToken, expiresIn } = response.data;
              localStorage.setItem('accessToken', accessToken);

              // Set token expiry time
              const expiryTime = new Date().getTime() + expiresIn * 1000;
              localStorage.setItem('tokenExpiry', expiryTime);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return axios(originalRequest);
            } catch (refreshError) {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('tokenExpiry');
              localStorage.removeItem('boardId');
              setIsAuthenticated(false);
              throw refreshError;
            }
          }
          return Promise.reject(error);
        }
      );
    };

    setupAxiosInterceptors();
  }, []);

  // Check token validity on app start
  useEffect(() => {
    const validateToken = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        
        if (!accessToken || !refreshToken) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check if token is expired
        if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
          try {
            const apiUrl = 'http://45.77.172.27:5001';
            const response = await axios.post(`${apiUrl}/api/auth/refresh`, {
              refreshToken
            });

            const { accessToken: newAccessToken, expiresIn } = response.data;
            localStorage.setItem('accessToken', newAccessToken);
            
            // Set new token expiry time
            const newExpiryTime = new Date().getTime() + expiresIn * 1000;
            localStorage.setItem('tokenExpiry', newExpiryTime);
            
            setIsAuthenticated(true);
          } catch (error) {
            handleAuthError();
          }
        } else {
          try {
            const apiUrl = 'http://45.77.172.27:5001';
            await axios.get(`${apiUrl}/api/auth/validate`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            setIsAuthenticated(true);
          } catch (error) {
            handleAuthError();
          }
        }
      } catch (error) {
        setError('Failed to validate authentication. Please try logging in again.');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const handleAuthError = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('boardId');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <div className="spinner"></div>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.href = '/'}>
          Return to Login
        </button>
      </ErrorContainer>
    );
  }

  return (
    <AppContainer>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to={`/board/${localStorage.getItem('boardId')}`} />
              ) : (
                <Login setAuth={setIsAuthenticated} />
              )
            } 
          />
          <Route 
            path="/signup" 
            element={
              isAuthenticated ? (
                <Navigate to={`/board/${localStorage.getItem('boardId')}`} />
              ) : (
                <SignUp setAuth={setIsAuthenticated} />
              )
            } 
          />
          <Route 
            path="/board" 
            element={
              isAuthenticated ? (
                <Navigate to={`/board/${localStorage.getItem('boardId')}`} />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          <Route 
            path="/board/:boardId" 
            element={
              isAuthenticated ? (
                <Board />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AppContainer>
  );
};

export default App;
