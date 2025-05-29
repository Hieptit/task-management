const mysql = require('mysql2/promise');

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'hiep2523'
  });

  try {
    // Drop database if exists
    await connection.execute('DROP DATABASE IF EXISTS task_management');
    
    // Create database
    await connection.execute('CREATE DATABASE task_management');
    
    console.log('Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await connection.end();
  }
}

resetDatabase(); 