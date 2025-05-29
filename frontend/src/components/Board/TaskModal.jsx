import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #6c5ce7;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #6c5ce7;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #666;
`;

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border: 2px solid ${props => props.selected ? '#6c5ce7' : '#ddd'};
  border-radius: 8px;
  background: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    border-color: #6c5ce7;
  }
`;

const StatusOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const StatusButton = styled.button`
  padding: 10px;
  border: none;
  border-radius: 5px;
  background: ${props => props.selected ? props.color : 'white'};
  color: ${props => props.selected ? 'white' : props.color};
  border: 2px solid ${props => props.color};
  cursor: pointer;
  font-weight: 500;
  &:hover {
    background: ${props => props.color};
    color: white;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  flex: 1;
`;

const SaveButton = styled(Button)`
  background: #6c5ce7;
  color: white;
  &:hover {
    background: #5f50e1;
  }
`;

const DeleteButton = styled(Button)`
  background: #ff4444;
  color: white;
  &:hover {
    background: #cc0000;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-bottom: 15px;
`;

const TaskModal = ({ task, onClose, onUpdate, onDelete }) => {
  const [name, setName] = useState(task.name || '');
  const [description, setDescription] = useState(task.description || '');
  const [icon, setIcon] = useState(task.icon || '📝');
  const [status, setStatus] = useState(task.status || 'in-progress');
  const [error, setError] = useState('');

  const icons = ['📝', '⏰', '🎉', '☕', '📚', '💡', '🔥', '⭐', '❤️'];
  const statusOptions = [
    { label: 'In Progress', value: 'in-progress', color: '#ffd700' },
    { label: 'Completed', value: 'completed', color: '#4CAF50' },
    { label: "Won't Do", value: 'wont-do', color: '#ff4444' }
  ];

  const handleSave = () => {
    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    onUpdate({
      ...task,
      name: name.trim(),
      description: description.trim(),
      icon,
      status
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Task details</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <Label>Task name</Label>
        <Input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter task name"
          required
        />

        <Label>Description</Label>
        <TextArea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Enter a short description"
        />

        <Label>Icon</Label>
        <IconGrid>
          {icons.map(i => (
            <IconButton
              key={i}
              selected={i === icon}
              onClick={() => setIcon(i)}
            >
              {i}
            </IconButton>
          ))}
        </IconGrid>

        <Label>Status</Label>
        <StatusOptions>
          {statusOptions.map(option => (
            <StatusButton
              key={option.value}
              selected={option.value === status}
              color={option.color}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </StatusButton>
          ))}
        </StatusOptions>

        <ButtonGroup>
          <DeleteButton onClick={handleDelete}>
            Delete
          </DeleteButton>
          <SaveButton onClick={handleSave}>
            Save
          </SaveButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default TaskModal; 