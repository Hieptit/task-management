const mysql = require('mysql2/promise');

async function setupDatabase() {
  let connection;
  try {
    // First connection to create database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'hiep2523'
    });

    // Create database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS task_management');
    console.log('Database created successfully');
    
    // Close the first connection
    await connection.end();

    // Create new connection with database selected
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'hiep2523',
      database: 'task_management'
    });

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create boards table
    await connection.query(`
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

    // Create tasks table
    await connection.query(`
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

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
