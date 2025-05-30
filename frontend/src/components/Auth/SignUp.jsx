import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const SignUpContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: #fff;
`;

const SignUpForm = styled.form`
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h1`
  font-size: 32px;
  color: #333;
  margin-bottom: 0;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 16px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:focus {
    outline: none;
    border-color: #6c63ff;
  }

  &::placeholder {
    color: #999;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 15px;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5a52d9;
  }

  &:disabled {
    background: #a5a5a5;
    cursor: not-allowed;
  }
`;

const LoginText = styled.p`
  text-align: center;
  color: #666;
  margin-top: 10px;
  font-size: 14px;

  a {
    color: #6c63ff;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  padding: 10px;
  background: #ffe6e6;
  border-radius: 8px;
  font-size: 14px;
`;

const SignUp = ({ setAuth }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = 'http://45.77.172.27:5001';
      const response = await axios.post(`${apiUrl}/api/auth/signup`, {
        email: formData.email,
        password: formData.password
      });
      console.log('Signup response:', response.data); // Debug log
      
      const { accessToken, refreshToken, expiresIn } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set token expiry time
      const expiryTime = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem('tokenExpiry', expiryTime);

      setAuth(true);
      navigate('/boards');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignUpContainer>
      <SignUpForm onSubmit={handleSubmit}>
        <div>
          <Title>Create an account</Title>
          <Subtitle>Sign up to get started</Subtitle>
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Input
          type="email"
          name="email"
          placeholder="Enter email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          type="password"
          name="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>

        <LoginText>
          Already have an account? <Link to="/">Sign in</Link>
        </LoginText>
      </SignUpForm>
    </SignUpContainer>
  );
};

export default SignUp; 