require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: ['http://45.76.161.44:3001'],  // Chỉ cho phép frontend access
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MySQL Connection Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'hiep2523',
  database: process.env.DB_NAME || 'task_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Initialize MySQL Connection Pool
async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
    await createTables();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Create database tables
async function createTables() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS boards (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL DEFAULT 'My Task Board',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        board_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('in-progress', 'completed', 'wont-do') DEFAULT 'in-progress',
        icon VARCHAR(10) DEFAULT '📝',
        position INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.execute(
      'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
      [userId, email, hashedPassword]
    );

    // Create default board for new user
    const boardId = uuidv4();
    await pool.execute(
      'INSERT INTO boards (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [boardId, userId, 'My Task Board', 'Tasks to keep organised']
    );

    // Create default tasks
    const defaultTasks = [
      {
        name: 'Task in Progress',
        description: 'This is a task that is currently in progress',
        status: 'in-progress',
        icon: '⏰'
      },
      {
        name: 'Task Completed',
        description: 'This is a completed task',
        status: 'completed',
        icon: '🎉'
      },
      {
        name: 'Task Won\'t Do',
        description: 'This is a task that won\'t be done',
        status: 'wont-do',
        icon: '☕'
      }
    ];

    for (let i = 0; i < defaultTasks.length; i++) {
      const task = defaultTasks[i];
      await pool.execute(
        'INSERT INTO tasks (id, board_id, name, description, status, icon, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), boardId, task.name, task.description, task.status, task.icon, i + 1]
      );
    }

    // Generate access token and refresh token
    const accessToken = jwt.sign(
      { userId: userId, email: email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: userId, email: email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      accessToken,
      refreshToken,
      boardId,
      expiresIn: 3600 // 1 hour in seconds
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get user's default board
    const [boards] = await pool.execute(
      'SELECT id FROM boards WHERE user_id = ? LIMIT 1',
      [user.id]
    );

    // Generate access token and refresh token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      accessToken,
      refreshToken,
      boardId: boards.length > 0 ? boards[0].id : null,
      expiresIn: 3600 // 1 hour in seconds
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      accessToken,
      expiresIn: 3600 // 1 hour in seconds
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// Add token validation endpoint
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
    // Token is already validated in authenticateToken middleware
    res.json({ valid: true });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Board Routes
app.get('/api/boards', authenticateToken, async (req, res) => {
  try {
    const [boards] = await pool.execute(
      'SELECT * FROM boards WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );

    // Get tasks count for each board
    const boardsWithTaskCount = await Promise.all(boards.map(async (board) => {
      const [tasks] = await pool.execute(
        'SELECT COUNT(*) as taskCount FROM tasks WHERE board_id = ?',
        [board.id]
      );
      return {
        ...board,
        taskCount: tasks[0].taskCount
      };
    }));

    res.json(boardsWithTaskCount);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/boards/:boardId', authenticateToken, async (req, res) => {
  try {
    const [boards] = await pool.execute(
      'SELECT * FROM boards WHERE id = ? AND user_id = ?',
      [req.params.boardId, req.user.userId]
    );

    if (boards.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const board = boards[0];

    const [tasks] = await pool.execute(
      'SELECT * FROM tasks WHERE board_id = ? ORDER BY position',
      [board.id]
    );

    res.json({
      ...board,
      tasks
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/boards', authenticateToken, async (req, res) => {
  try {
    const boardId = uuidv4();
    const { name = 'My Task Board', description = 'Tasks to keep organised' } = req.body;

    await pool.execute(
      'INSERT INTO boards (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [boardId, req.user.userId, name, description]
    );

    // Create default tasks
    const defaultTasks = [
      {
        name: 'Task in Progress',
        description: 'This is a task that is currently in progress',
        status: 'in-progress',
        icon: '⏰'
      },
      {
        name: 'Task Completed',
        description: 'This is a completed task',
        status: 'completed',
        icon: '🎉'
      },
      {
        name: 'Task Won\'t Do',
        description: 'This is a task that won\'t be done',
        status: 'wont-do',
        icon: '☕'
      }
    ];

    for (let i = 0; i < defaultTasks.length; i++) {
      const task = defaultTasks[i];
      await pool.execute(
        'INSERT INTO tasks (id, board_id, name, description, status, icon, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), boardId, task.name, task.description, task.status, task.icon, i + 1]
      );
    }

    res.status(201).json({ boardId });
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/boards/:boardId', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const boardId = req.params.boardId;

    // Verify board belongs to user
    const [boards] = await pool.execute(
      'SELECT * FROM boards WHERE id = ? AND user_id = ?',
      [boardId, req.user.userId]
    );

    if (boards.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    await pool.execute(
      'UPDATE boards SET name = ?, description = ? WHERE id = ?',
      [name, description, boardId]
    );

    res.json({ message: 'Board updated successfully' });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/boards/:boardId', authenticateToken, async (req, res) => {
  try {
    const boardId = req.params.boardId;

    // Verify board belongs to user
    const [boards] = await pool.execute(
      'SELECT * FROM boards WHERE id = ? AND user_id = ?',
      [boardId, req.user.userId]
    );

    if (boards.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Tasks will be deleted automatically due to foreign key constraint
    await pool.execute('DELETE FROM boards WHERE id = ?', [boardId]);

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Task Routes
app.put('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { name, description, status, icon } = req.body;
    const taskId = req.params.taskId;

    // Verify task belongs to user's board
    const [tasks] = await pool.execute(
      'SELECT t.* FROM tasks t JOIN boards b ON t.board_id = b.id WHERE t.id = ? AND b.user_id = ?',
      [taskId, req.user.userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await pool.execute(
      'UPDATE tasks SET name = ?, description = ?, status = ?, icon = ? WHERE id = ?',
      [name, description, status, icon, taskId]
    );

    const [updatedTask] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.taskId;

    // Verify task belongs to user's board
    const [tasks] = await pool.execute(
      'SELECT t.* FROM tasks t JOIN boards b ON t.board_id = b.id WHERE t.id = ? AND b.user_id = ?',
      [taskId, req.user.userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/boards/:boardId/tasks', authenticateToken, async (req, res) => {
  try {
    const { name, description, status, icon } = req.body;
    const boardId = req.params.boardId;

    // Verify board belongs to user
    const [boards] = await pool.execute(
      'SELECT * FROM boards WHERE id = ? AND user_id = ?',
      [boardId, req.user.userId]
    );

    if (boards.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Get max position
    const [positions] = await pool.execute(
      'SELECT MAX(position) as maxPos FROM tasks WHERE board_id = ?',
      [boardId]
    );
    const position = (positions[0].maxPos || 0) + 1;

    const taskId = uuidv4();
    await pool.execute(
      'INSERT INTO tasks (id, board_id, name, description, status, icon, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [taskId, boardId, name, description, status, icon, position]
    );

    const [newTask] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
