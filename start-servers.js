const { spawn } = require('child_process');
const path = require('path');

// Start backend server
const backendProcess = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

// Start frontend server
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('Stopping servers...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit();
});

console.log('Starting both servers...');
console.log('Backend: http://localhost:3000');
console.log('Frontend: http://localhost:5000'); 