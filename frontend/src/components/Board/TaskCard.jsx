import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'in-progress':
        return '#fff7e6';
      case 'completed':
        return '#e6ffe6';
      case 'wont-do':
        return '#ffe6e6';
      default:
        return '#f0f2f5';
    }
  }};
  padding: 15px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const TaskInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
`;

const Icon = styled.div`
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TaskContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const TaskName = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TaskDescription = styled.div`
  color: #666;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: ${props => {
    switch (props.status) {
      case 'in-progress':
        return '#ffd700';
      case 'completed':
        return '#4CAF50';
      case 'wont-do':
        return '#ff4444';
      default:
        return '#ddd';
    }
  }};
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const getStatusIcon = (status) => {
  switch (status) {
    case 'in-progress':
      return '⏳';
    case 'completed':
      return '✓';
    case 'wont-do':
      return '×';
    default:
      return '📝';
  }
};

const TaskCard = ({ task, onClick }) => {
  return (
    <Card status={task.status} onClick={onClick}>
      <TaskInfo>
        <Icon>{task.icon}</Icon>
        <TaskContent>
          <TaskName>{task.name}</TaskName>
          {task.description && (
            <TaskDescription>{task.description}</TaskDescription>
          )}
        </TaskContent>
      </TaskInfo>
      <StatusIcon status={task.status}>
        {getStatusIcon(task.status)}
      </StatusIcon>
    </Card>
  );
};

export default TaskCard; 