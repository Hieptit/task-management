import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: #f5f6fa;
`;

const LoginForm = styled.form`
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #6c5ce7;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: #6c5ce7;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background: #5f50e1;
  }
  &:disabled {
    background: #b3b3b3;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-bottom: 20px;
  text-align: center;
  padding: 10px;
  background: #ffe6e6;
  border-radius: 5px;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const SignupText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #666;
  a {
    color: #6c5ce7;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate input
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const apiUrl = 'http://45.77.172.27:5001';
      console.log('Attempting login...');
      const response = await axios.post(`${apiUrl}/api/auth/login`, formData);
      console.log('Login response:', response.data);
      
      const { accessToken, refreshToken, boardId, expiresIn } = response.data;
      
      // Store tokens and board ID
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('boardId', boardId);

      // Set token expiry time
      const expiryTime = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem('tokenExpiry', expiryTime.toString());

      // Update auth state and navigate
      setAuth(true);
      console.log('Navigating to board:', boardId);
      navigate(`/board/${boardId}`);
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
      
      // Clear any stored data on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('boardId');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <div>
          <Title>Login to account</Title>
          <Subtitle>Enter your credentials to access your account</Subtitle>
        </div>

        <ErrorMessage visible={!!error}>{error}</ErrorMessage>

        <Input
          type="email"
          name="email"
          placeholder="Enter email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <Input
          type="password"
          name="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <SignupText>
          Not a member? <Link to="/signup">Create an account</Link>
        </SignupText>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login; 