#!/usr/bin/env node

// Simple server starter for testing - bypasses TypeScript compilation issues
console.log('🚀 Starting DependencyWarden server in test mode...\n');

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-32-chars-long';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-only';

// Optional environment variables
process.env.GITHUB_TOKEN = 'test-github-token';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.SLACK_BOT_TOKEN = 'test-slack-token';
process.env.GOOGLE_API_KEY = 'test-google-api-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

console.log('✅ Environment variables configured for testing');

// Import and start the server
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'client')));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'configured' : 'missing'
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Basic API endpoints for testing
app.use(express.json());

app.post('/api/auth/register', (req, res) => {
  console.log('Register request:', req.body);
  res.status(201).json({ success: true, message: 'User registered successfully' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  res.status(200).json({ 
    success: true, 
    token: 'test-jwt-token',
    user: { id: 1, email: req.body.email || 'test@example.com' }
  });
});

app.get('/api/auth/user', (req, res) => {
  res.status(200).json({ 
    user: { id: 1, email: 'test@example.com', username: 'testuser' }
  });
});

app.get('/api/stats', (req, res) => {
  res.status(200).json({
    totalRepos: 5,
    activeAlerts: 12,
    lastScan: new Date().toISOString(),
    vulnerabilities: {
      critical: 2,
      high: 4,
      medium: 6,
      low: 8
    }
  });
});

app.get('/api/repositories', (req, res) => {
  res.status(200).json([
    {
      id: 1,
      name: 'Test Repository',
      url: 'https://github.com/test/repo',
      lastScanned: new Date().toISOString(),
      alerts: 5
    }
  ]);
});

app.post('/api/repositories', (req, res) => {
  console.log('Create repository request:', req.body);
  res.status(200).json({ 
    success: true, 
    id: Math.floor(Math.random() * 1000),
    message: 'Repository added successfully'
  });
});

app.get('/api/repositories/:id', (req, res) => {
  const id = req.params.id;
  res.status(200).json({
    id: parseInt(id),
    name: `Repository ${id}`,
    url: `https://github.com/test/repo${id}`,
    lastScanned: new Date().toISOString(),
    alerts: 3
  });
});

app.post('/api/repositories/:id/scan', (req, res) => {
  const repoId = req.params.id;
  console.log(`Scan request for repository ${repoId}`);
  res.status(200).json({
    success: true,
    message: 'Scan initiated successfully',
    scanId: Math.floor(Math.random() * 1000)
  });
});

app.get('/api/notifications', (req, res) => {
  res.status(200).json([
    {
      id: 1,
      type: 'vulnerability',
      severity: 'high',
      message: 'Critical vulnerability found in lodash package',
      timestamp: new Date().toISOString()
    }
  ]);
});

app.post('/api/security/analyze', (req, res) => {
  console.log('Security analysis request:', req.body);
  res.status(200).json({
    success: true,
    analysis: 'The vulnerability appears to be a SQL injection issue...',
    recommendations: ['Update to latest version', 'Apply security patch']
  });
});

app.get('/api/jobs/stats', (req, res) => {
  res.status(200).json({
    total: 25,
    running: 2,
    completed: 20,
    failed: 3
  });
});

// Catch-all for missing API endpoints
app.use('/api/*', (req, res) => {
  console.log(`Missing API endpoint: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start server
const port = 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Test server running on http://localhost:${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📊 Ready for testing!\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
}); 