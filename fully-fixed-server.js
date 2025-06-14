import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

let repositories = [
  {
    id: 1,
    name: 'Test Repository',
    url: 'https://github.com/test/repo',
    lastScanned: new Date().toISOString(),
    alerts: 5
  },
  {
    id: 2,
    name: 'Another Repo',
    url: 'https://github.com/test/another',
    lastScanned: new Date().toISOString(),
    alerts: 2
  }
];

let alerts = [
  {
    id: 1,
    severity: 'critical',
    title: 'Critical Security Vulnerability',
    description: 'Lodash has a security vulnerability',
    repository: 'Test Repository',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    severity: 'high',
    title: 'Outdated Package Version',
    description: 'Express version is outdated',
    repository: 'Another Repo',
    createdAt: new Date().toISOString()
  }
];

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });
    
    const token = jwt.sign({ email }, 'secret-key', { expiresIn: '1h' });
    
    res.json({
      success: true,
      token,
      user: { email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/api/repositories', (req, res) => {
  console.log('Fetching repositories');
  res.json(repositories);
});

app.post('/api/repositories', (req, res) => {
  try {
    const { url, name } = req.body;
    console.log('Adding repository:', { url, name });
    
    const newRepo = {
      id: repositories.length + 1,
      name: name || 'Repository ' + (repositories.length + 1),
      url,
      lastScanned: new Date().toISOString(),
      alerts: Math.floor(Math.random() * 10)
    };
    
    repositories.push(newRepo);
    
    res.json({
      success: true,
      message: 'Repository added successfully',
      repository: newRepo
    });
  } catch (error) {
    console.error('Add repository error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to add repository'
    });
  }
});

app.get('/api/alerts', (req, res) => {
  console.log('Fetching alerts');
  res.json(alerts);
});

app.get('/api/alerts/critical', (req, res) => {
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  res.json(criticalAlerts);
});

app.get('/api/alerts/high', (req, res) => {
  const highAlerts = alerts.filter(alert => alert.severity === 'high');
  res.json(highAlerts);
});

// Signup endpoint
app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password, company } = req.body;
    console.log('Signup attempt:', { email, company });
    
    // In a real app, you'd check if user exists and create new user
    // For demo purposes, we'll just return success
    const token = jwt.sign({ email }, 'secret-key', { expiresIn: '1h' });
    
    res.json({
      success: true,
      token,
      user: { email, company }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({
      success: false,
      message: 'Signup failed'
    });
  }
});

// Security Copilot endpoint
app.post('/api/security-copilot/ask', (req, res) => {
  try {
    const { question } = req.body;
    console.log('Security Copilot question:', question);
    
    // Mock AI response based on question content
    let response = "I'm your AI Security Copilot. ";
    
    if (question.toLowerCase().includes('vulnerability') || question.toLowerCase().includes('cve')) {
      response += "I can help you analyze this vulnerability. Based on the security context, I recommend:\n\n";
      response += "1. **Immediate Action**: Update the affected package to the latest secure version\n";
      response += "2. **Risk Assessment**: This vulnerability has a medium-to-high impact\n";
      response += "3. **Remediation**: I can generate an automated pull request to fix this issue\n\n";
      response += "Would you like me to create an auto-fix PR for this vulnerability?";
    } else if (question.toLowerCase().includes('fix') || question.toLowerCase().includes('update')) {
      response += "For security fixes, I recommend:\n\n";
      response += "• **Automated PR Generation**: Let me create a pull request with the fix\n";
      response += "• **Testing Strategy**: Ensure CI passes before merging\n";
      response += "• **Rollback Plan**: Have a rollback strategy ready\n\n";
      response += "Shall I proceed with generating the fix?";
    } else {
      response += "I can help with security analysis, vulnerability assessment, and automated remediation. Ask me about:\n\n";
      response += "• Specific CVEs or vulnerabilities\n";
      response += "• Security best practices\n";
      response += "• Risk assessments\n";
      response += "• Automated fix generation";
    }
    
    res.json({
      success: true,
      response: response,
      confidence: 0.85,
      suggestions: [
        "Generate auto-fix PR",
        "Analyze vulnerability impact",
        "Security best practices"
      ]
    });
  } catch (error) {
    console.error('Security Copilot error:', error);
    res.status(500).json({
      success: false,
      message: 'AI analysis failed'
    });
  }
});

// Auto-fix PR generation endpoint
app.post('/api/auto-fix/generate', (req, res) => {
  try {
    const { alertId, packageName, currentVersion, fixedVersion } = req.body;
    console.log('Generating auto-fix PR:', { alertId, packageName, currentVersion, fixedVersion });
    
    // Mock PR generation
    const prNumber = Math.floor(Math.random() * 100) + 40;
    const repoName = Math.random() > 0.5 ? 'Test Repository' : 'Another Repo';
    
    const newPR = {
      id: prNumber,
      title: `Security fix: Update ${packageName} to ${fixedVersion || 'latest'}`,
      description: `Fixes security vulnerability in ${packageName}`,
      repository: repoName,
      url: `https://github.com/test/repo/pull/${prNumber}`,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Auto-fix PR generated successfully',
      pullRequest: newPR
    });
  } catch (error) {
    console.error('Auto-fix PR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate auto-fix PR'
    });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DependencyWarden</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-color: #007bff;
            --primary-hover: #0056b3;
            --secondary-color: #6c757d;
            --success-color: #28a745;
            --danger-color: #dc3545;
            --warning-color: #ffc107;
            --bg-color: #f5f7fa;
            --surface-color: #ffffff;
            --text-color: #333333;
            --border-color: #e0e6ed;
            --shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
            --shadow-lg: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }

        .dark-theme {
            --bg-color: #1a1d23;
            --surface-color: #2d3748;
            --text-color: #e2e8f0;
            --border-color: #4a5568;
            --shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.3);
            --shadow-lg: 0 0.5rem 1rem rgba(0, 0, 0, 0.4);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            overflow-x: hidden;
        }

        /* CRITICAL FIX: App container with proper stacking */
        .app-container {
            position: relative;
            width: 100%;
            min-height: 100vh;
        }

        /* CRITICAL FIX: Page system with absolute positioning and z-index control */
        .page {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            min-height: 100vh;
            z-index: 1;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .page.active {
            opacity: 1;
            visibility: visible;
            z-index: 10;
        }

        /* Navigation - HIGHER Z-INDEX for proper stacking */
        nav {
            position: relative;
            z-index: 100;
            background: var(--surface-color);
            padding: 1rem 2rem;
            box-shadow: var(--shadow);
            border-bottom: 1px solid var(--border-color);
        }

        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .nav-links {
            display: flex;
            gap: 0.5rem;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--text-color);
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .nav-links a:hover {
            background-color: var(--primary-color);
            color: white;
        }

        .nav-links a.active {
            background-color: var(--primary-color);
            color: white;
        }

        .user-menu {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .theme-toggle {
            background: none;
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 0.5rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 1.2rem;
            transition: all 0.2s ease;
        }

        .theme-toggle:hover {
            background-color: var(--border-color);
        }

        /* Login Page - FULL SCREEN OVERLAY */
        .login-page {
            background-color: var(--bg-color);
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .login-form {
            background: var(--surface-color);
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            width: 100%;
            max-width: 400px;
            border: 1px solid var(--border-color);
            position: relative;
            z-index: 1001;
        }

        .login-form h1 {
            text-align: center;
            margin-bottom: 2rem;
            color: var(--primary-color);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        input[type="email"],
        input[type="password"],
        input[type="text"],
        input[type="url"] {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            background-color: var(--surface-color);
            color: var(--text-color);
            font-size: 1rem;
            transition: border-color 0.2s ease;
        }

        input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
            width: 100%;
        }

        button:hover {
            background-color: var(--primary-hover);
        }

        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-secondary {
            background-color: var(--secondary-color);
            width: auto;
        }

        .btn-secondary:hover {
            background-color: #545b62;
        }

        /* Content pages - with top margin for navigation */
        .page-content {
            padding-top: 0;
            width: 100%;
            min-height: calc(100vh - 0px);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Dashboard */
        .dashboard-header {
            margin-bottom: 2rem;
        }

        .dashboard-header h1 {
            color: var(--text-color);
            margin-bottom: 0.5rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: var(--surface-color);
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            text-align: center;
        }

        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }

        .stat-label {
            color: var(--secondary-color);
            font-weight: 500;
        }

        /* Cards */
        .card {
            background: var(--surface-color);
            border-radius: 0.5rem;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            margin-bottom: 1.5rem;
        }

        .card-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
        }

        .card-header h2 {
            margin: 0;
            color: var(--text-color);
        }

        .card-body {
            padding: 1.5rem;
        }

        /* Lists */
        .list-group {
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .list-item {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .list-item:last-child {
            border-bottom: none;
        }

        .list-item-content h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1rem;
        }

        .list-item-content p {
            margin: 0;
            color: var(--secondary-color);
            font-size: 0.875rem;
        }

        .badge {
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .badge-primary {
            background-color: var(--primary-color);
            color: white;
        }

        .badge-danger {
            background-color: var(--danger-color);
            color: white;
        }

        .badge-warning {
            background-color: var(--warning-color);
            color: black;
        }

        /* Alerts */
        .alert {
            padding: 1rem;
            border-radius: 0.375rem;
            border: 1px solid transparent;
            margin-bottom: 1rem;
        }

        .alert-success {
            background-color: rgba(40, 167, 69, 0.1);
            border-color: var(--success-color);
            color: var(--success-color);
        }

        .alert-danger {
            background-color: rgba(220, 53, 69, 0.1);
            border-color: var(--danger-color);
            color: var(--danger-color);
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 2000;
        }

        .modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: var(--surface-color);
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            width: 90%;
            max-width: 500px;
            border: 1px solid var(--border-color);
            position: relative;
            z-index: 2001;
        }

        .modal-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
        }

        .modal-header h2 {
            margin: 0;
        }

        .modal-body {
            padding: 1.5rem;
        }

        .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 1rem;
            }

            .container {
                padding: 1rem;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .list-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
        }

        /* Utility Classes */
        .d-none {
            display: none !important;
        }

        .text-center {
            text-align: center;
        }

        .mb-2 {
            margin-bottom: 1rem;
        }

        .mb-3 {
            margin-bottom: 1.5rem;
        }

        .alert-border-left {
            border-left: 4px solid;
        }

        .alert-critical {
            border-left-color: var(--danger-color);
        }

        .alert-high {
            border-left-color: var(--warning-color);
        }
    </style>
</head>
<body class="light-theme">
    <div class="app-container" data-testid="app">
        <!-- Navigation - ALWAYS present but hidden when not authenticated -->
        <nav data-testid="navigation" class="d-none">
            <div class="nav-container">
                <div class="nav-links">
                    <a data-testid="dashboard-nav" href="/dashboard">Dashboard</a>
                    <a data-testid="repos-nav" href="/repositories">Repositories</a>
                    <a data-testid="alerts-nav" href="/alerts">Alerts</a>
                    <a data-testid="notifs-nav" href="/notifications">Notifications</a>
                    <a data-testid="copilot-nav" href="/security-copilot">AI Copilot</a>
                    <a data-testid="autofix-nav" href="/auto-fix-prs">Auto Fix</a>
                </div>
                <div data-testid="user-menu" class="user-menu">
                    <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
                    <button onclick="logout()">Logout</button>
                </div>
            </div>
        </nav>

        <!-- Login Page - FIXED OVERLAY -->
        <div data-testid="login-page" class="page login-page active">
            <form data-testid="login-form" class="login-form" onsubmit="handleLogin(event)">
                <h1>DependencyWarden</h1>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input data-testid="email-input" type="email" id="email" required placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input data-testid="password-input" type="password" id="password" required placeholder="Enter your password">
                </div>
                <button data-testid="login-button" type="submit">Login</button>
                <div data-testid="login-error" class="alert alert-danger d-none">Invalid credentials</div>
            </form>
        </div>

        <!-- Dashboard -->
        <div data-testid="dashboard" class="page">
            <div class="page-content">
                <div class="container">
                    <div class="dashboard-header">
                        <h1>Dashboard</h1>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div data-testid="total-repos" class="stat-number">5</div>
                            <div class="stat-label">Total Repositories</div>
                        </div>
                        <div class="stat-card">
                            <div data-testid="active-alerts" class="stat-number">3</div>
                            <div class="stat-label">Active Alerts</div>
                        </div>
                        <div class="stat-card">
                            <div data-testid="critical-issues" class="stat-number">1</div>
                            <div class="stat-label">Critical Issues</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Recent Repositories</h2>
                        </div>
                        <div data-testid="dashboard-repo-list" class="card-body">
                            <div class="list-group" id="dashboard-repo-items">
                                <!-- Populated by JavaScript -->
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Vulnerability Summary</h2>
                        </div>
                        <div data-testid="vuln-summary" class="card-body">
                            <div class="list-item alert-border-left alert-critical">
                                <span>Critical: 1</span>
                            </div>
                            <div class="list-item alert-border-left alert-high">
                                <span>High: 2</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Repositories Page -->
        <div data-testid="repositories-page" class="page">
            <div class="page-content">
                <div class="container">
                    <div class="dashboard-header">
                        <h1>Repositories</h1>
                        <button data-testid="add-repo-button" onclick="showAddModal()">Add Repository</button>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Your Repositories</h2>
                        </div>
                        <div data-testid="repo-list" class="card-body">
                            <div class="list-group" id="repo-items">
                                <!-- Populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Alerts Page -->
        <div data-testid="alerts-section" class="page">
            <div class="page-content">
                <div class="container">
                    <div class="dashboard-header">
                        <h1>Security Alerts</h1>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Critical Alerts</h2>
                        </div>
                        <div data-testid="critical-alerts" class="card-body">
                            <div class="list-group" id="critical-alerts-list">
                                <!-- Populated by JavaScript -->
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>High Priority Alerts</h2>
                        </div>
                        <div data-testid="high-alerts" class="card-body">
                            <div class="list-group" id="high-alerts-list">
                                <!-- Populated by JavaScript -->
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Scan Status</h2>
                        </div>
                        <div data-testid="scan-status" class="card-body">
                            <div data-testid="scan-progress">Ready to scan</div>
                            <button data-testid="start-scan-button" onclick="startScan()" class="mb-2">Start New Scan</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notifications Page -->
        <div data-testid="notifications-list" class="page">
            <div class="page-content">
                <div class="container">
                    <div class="dashboard-header">
                        <h1>Notifications</h1>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Recent Notifications</h2>
                        </div>
                        <div class="card-body">
                            <div class="list-group">
                                <div class="list-item">
                                    <div class="list-item-content">
                                        <h3>New security alert for Test Repository</h3>
                                        <p>2 hours ago</p>
                                    </div>
                                </div>
                                <div class="list-item">
                                    <div class="list-item-content">
                                        <h3>Scan completed for Another Repo</h3>
                                        <p>1 day ago</p>
                                    </div>
                                </div>
                                <div class="list-item">
                                    <div class="list-item-content">
                                        <h3>Repository added successfully</h3>
                                        <p>2 days ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Homepage -->
        <div data-testid="homepage" class="page">
            <div class="page-content">
                <div class="container">
                    <div class="text-center mb-8">
                        <h1 class="text-4xl font-bold mb-4">DependencyWarden</h1>
                        <p class="text-xl text-gray-600 mb-8">AI-powered dependency security monitoring for modern development teams</p>
                        <div class="space-x-4">
                            <button onclick="showPage('login-page')" class="btn-primary">Sign In</button>
                            <button onclick="showPage('signup-page')" class="btn-secondary">Get Started</button>
                        </div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>🔒 Security First</h3>
                            <p>Real-time vulnerability detection with AI-powered threat analysis</p>
                        </div>
                        <div class="stat-card">
                            <h3>⚡ Auto-Fix PRs</h3>
                            <p>Automated GitHub pull requests for security vulnerability fixes</p>
                        </div>
                        <div class="stat-card">
                            <h3>🤖 AI Copilot</h3>
                            <p>Intelligent security guidance with context-aware recommendations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Signup Page -->
        <div data-testid="signup-page" class="page">
            <div class="page-content">
                <div class="login-container">
                    <form data-testid="signup-form" class="login-form" onsubmit="handleSignup(event)">
                        <h1>Join DependencyWarden</h1>
                        <div class="form-group">
                            <label for="signup-email">Email</label>
                            <input data-testid="signup-email-input" type="email" id="signup-email" required placeholder="Enter your email">
                        </div>
                        <div class="form-group">
                            <label for="signup-password">Password</label>
                            <input data-testid="signup-password-input" type="password" id="signup-password" required placeholder="Create a password">
                        </div>
                        <div class="form-group">
                            <label for="signup-company">Company (optional)</label>
                            <input data-testid="signup-company-input" type="text" id="signup-company" placeholder="Your company name">
                        </div>
                        <button data-testid="signup-button" type="submit">Create Account</button>
                        <div data-testid="signup-error" class="alert alert-danger d-none">Signup failed</div>
                        <div class="text-center mt-4">
                            <p>Already have an account? <a href="#" onclick="showPage('login-page')">Sign In</a></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Security Copilot Page -->
        <div data-testid="security-copilot-page" class="page">
            <div class="page-content">
                <div class="container">
                    <div class="dashboard-header">
                        <h1>🤖 Security Copilot</h1>
                        <p>AI-powered vulnerability analysis and remediation guidance</p>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Ask Your Security Question</h2>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <textarea data-testid="copilot-input" placeholder="Ask about vulnerabilities, security best practices, or remediation steps..." rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.375rem;"></textarea>
                            </div>
                            <button data-testid="ask-copilot" onclick="askCopilot()">Ask Copilot</button>
                            <div data-testid="copilot-response" class="mt-4 p-4 bg-gray-50 rounded hidden">
                                <!-- AI responses appear here -->
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Recent Security Insights</h2>
                        </div>
                        <div class="card-body">
                            <div class="list-group">
                                <div class="list-item">
                                    <div class="list-item-content">
                                        <h3>Critical: SQL Injection vulnerability in mysql package</h3>
                                        <p>AI recommends immediate update to v2.18.1 or higher</p>
                                    </div>
                                    <span class="badge badge-danger">Critical</span>
                                </div>
                                <div class="list-item">
                                    <div class="list-item-content">
                                        <h3>High: Outdated Express.js version detected</h3>
                                        <p>Security patch available - automated PR ready</p>
                                    </div>
                                    <span class="badge badge-warning">High</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Auto Fix PRs Page -->
        <div data-testid="auto-fix-prs-page" class="page">
            <div class="page-content">
                <div class="container">
                    <div class="dashboard-header">
                        <h1>⚡ Auto Fix PRs</h1>
                        <p>Automated GitHub pull requests for security vulnerability fixes</p>
                        <button data-testid="generate-fix-pr" onclick="generateFixPR()">Generate Fix PR</button>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Recent Auto-Fix Pull Requests</h2>
                        </div>
                        <div data-testid="fix-prs-list" class="card-body">
                            <div class="list-group" id="fix-prs-items">
                                <div class="list-item">
                                    <div class="list-item-content">
                                        <h3>Security fix: Update mysql to 2.18.1</h3>
                                        <p>Fixes CVE-2021-1234 - SQL injection vulnerability</p>
                                        <small>PR #42 • Test Repository • 2 hours ago</small>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="badge badge-primary">Open</span>
                                        <a href="https://github.com/test/repo/pull/42" target="_blank" class="btn-secondary" style="text-decoration: none; padding: 0.25rem 0.5rem; font-size: 0.75rem;">View PR</a>
                                    </div>
                                </div>
                                <div class="list-item">
                                    <div class="list-item-content">
                                        <h3>Security fix: Update express to 4.18.2</h3>
                                        <p>Fixes multiple security vulnerabilities</p>
                                        <small>PR #39 • Another Repo • 1 day ago</small>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="badge badge-success" style="background-color: var(--success-color);">Merged</span>
                                        <a href="https://github.com/test/another/pull/39" target="_blank" class="btn-secondary" style="text-decoration: none; padding: 0.25rem 0.5rem; font-size: 0.75rem;">View PR</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>Auto-Fix Configuration</h2>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked> Auto-generate PRs for critical vulnerabilities
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked> Auto-generate PRs for high severity vulnerabilities
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox"> Auto-merge PRs after CI passes
                                </label>
                            </div>
                            <button class="btn-secondary">Save Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Repository Modal -->
        <div data-testid="add-repo-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Repository</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="repo-url">Repository URL</label>
                        <input data-testid="repo-url-input" type="url" id="repo-url" placeholder="https://github.com/user/repo">
                    </div>
                    <div class="form-group">
                        <label for="repo-name">Repository Name (optional)</label>
                        <input data-testid="repo-name-input" type="text" id="repo-name" placeholder="My Repository">
                    </div>
                    <div data-testid="success-message" class="alert alert-success d-none">Repository added successfully</div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeAddModal()">Cancel</button>
                    <button data-testid="add-repo-submit" onclick="addRepo()">Add Repository</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let isAuthenticated = false;
        let currentTheme = 'light';

        // CRITICAL FIX: Completely rewritten page switching
        function showPage(pageName) {
            console.log('🔄 Switching to page:', pageName);
            
            // First, hide ALL pages by removing active class
            const allPages = document.querySelectorAll('.page');
            allPages.forEach(page => {
                page.classList.remove('active');
            });
            
            // Handle navigation visibility
            const nav = document.querySelector('[data-testid="navigation"]');
            if (isAuthenticated && pageName !== 'login-page') {
                nav.classList.remove('d-none');
            } else {
                nav.classList.add('d-none');
            }
            
            // Show the requested page after a brief delay to ensure clean transition
            setTimeout(() => {
                const targetPage = document.querySelector('[data-testid="' + pageName + '"]');
                if (targetPage) {
                    targetPage.classList.add('active');
                    console.log('✅ Page activated:', pageName);
                } else {
                    console.error('❌ Page not found:', pageName);
                }
            }, 50);
            
            // Update navigation active states
            if (isAuthenticated && nav && !nav.classList.contains('d-none')) {
                document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
                const navSelector = pageName.replace('-page', '').replace('-section', '').replace('-list', '');
                const activeLink = document.querySelector('[data-testid="' + navSelector + '-nav"]');
                if (activeLink) {
                    activeLink.classList.add('active');
                } else if (pageName === 'dashboard') {
                    const dashboardLink = document.querySelector('[data-testid="dashboard-nav"]');
                    if (dashboardLink) dashboardLink.classList.add('active');
                }
            }
        }

        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.className = currentTheme + '-theme';
            localStorage.setItem('theme', currentTheme);
            
            const themeButton = document.querySelector('.theme-toggle');
            themeButton.textContent = currentTheme === 'light' ? '🌙' : '☀️';
        }

        async function handleLogin(event) {
            event.preventDefault();
            const email = document.querySelector('[data-testid="email-input"]').value;
            const password = document.querySelector('[data-testid="password-input"]').value;
            
            console.log('🔐 Login attempt with:', email);
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                const errorEl = document.querySelector('[data-testid="login-error"]');
                
                if (data.success) {
                    console.log('✅ Login successful, switching to dashboard');
                    localStorage.setItem('authToken', data.token);
                    isAuthenticated = true;
                    showPage('dashboard');
                    errorEl.classList.add('d-none');
                    await loadDashboardData();
                } else {
                    console.log('❌ Login failed');
                    errorEl.classList.remove('d-none');
                }
            } catch (error) {
                console.error('❌ Login error:', error);
                document.querySelector('[data-testid="login-error"]').classList.remove('d-none');
            }
        }

        function logout() {
            console.log('🚪 Logging out');
            localStorage.removeItem('authToken');
            isAuthenticated = false;
            showPage('login-page');
        }

        async function handleSignup(event) {
            event.preventDefault();
            const email = document.querySelector('[data-testid="signup-email-input"]').value;
            const password = document.querySelector('[data-testid="signup-password-input"]').value;
            const company = document.querySelector('[data-testid="signup-company-input"]').value;
            
            console.log('🆕 Signup attempt with:', email);
            
            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, company })
                });
                
                const data = await response.json();
                const errorEl = document.querySelector('[data-testid="signup-error"]');
                
                if (data.success) {
                    console.log('✅ Signup successful, switching to dashboard');
                    localStorage.setItem('authToken', data.token);
                    isAuthenticated = true;
                    showPage('dashboard');
                    errorEl.classList.add('d-none');
                    await loadDashboardData();
                } else {
                    console.log('❌ Signup failed');
                    errorEl.classList.remove('d-none');
                }
            } catch (error) {
                console.error('❌ Signup error:', error);
                document.querySelector('[data-testid="signup-error"]').classList.remove('d-none');
            }
        }

        async function askCopilot() {
            const input = document.querySelector('[data-testid="copilot-input"]');
            const responseEl = document.querySelector('[data-testid="copilot-response"]');
            const question = input.value.trim();
            
            if (!question) {
                alert('Please enter a security question');
                return;
            }
            
            console.log('🤖 Asking Security Copilot:', question);
            
            try {
                responseEl.innerHTML = '<p>🤔 Analyzing your security question...</p>';
                responseEl.classList.remove('hidden');
                
                const response = await fetch('/api/security-copilot/ask', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ question })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    let suggestionsHtml = '';
                    if (data.suggestions) {
                        suggestionsHtml = '<div class="mt-3"><strong>Quick Actions:</strong>' +
                            data.suggestions.map(s => '<button class="btn-secondary mr-2" style="margin: 0.25rem; padding: 0.5rem;">' + s + '</button>').join('') +
                            '</div>';
                    }
                    
                    responseEl.innerHTML = 
                        '<div class="copilot-response">' +
                            '<h4>🤖 Security Copilot Response:</h4>' +
                            '<div style="white-space: pre-line; margin: 1rem 0;">' + data.response + '</div>' +
                            '<div class="mt-3"><strong>Confidence:</strong> ' + Math.round(data.confidence * 100) + '%</div>' +
                            suggestionsHtml +
                        '</div>';
                    input.value = '';
                } else {
                    responseEl.innerHTML = '<p style="color: red;">❌ Failed to get AI response. Please try again.</p>';
                }
            } catch (error) {
                console.error('Copilot error:', error);
                responseEl.innerHTML = '<p style="color: red;">❌ Error connecting to Security Copilot.</p>';
            }
        }

        async function generateFixPR() {
            console.log('⚡ Generating auto-fix PR');
            
            try {
                const response = await fetch('/api/auto-fix/generate', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ 
                        alertId: 1,
                        packageName: 'mysql',
                        currentVersion: '2.17.0',
                        fixedVersion: '2.18.1'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert(`✅ Auto-fix PR generated successfully!\n\nPR: ${data.pullRequest.title}\nRepository: ${data.pullRequest.repository}\nURL: ${data.pullRequest.url}`);
                    
                    // Add the new PR to the list
                    const prsList = document.getElementById('fix-prs-items');
                    if (prsList) {
                        const newPRHtml = `
                            <div class="list-item">
                                <div class="list-item-content">
                                    <h3>${data.pullRequest.title}</h3>
                                    <p>${data.pullRequest.description}</p>
                                    <small>PR #${data.pullRequest.id} • ${data.pullRequest.repository} • Just now</small>
                                </div>
                                <div class="flex gap-2">
                                    <span class="badge badge-primary">Open</span>
                                    <a href="${data.pullRequest.url}" target="_blank" class="btn-secondary" style="text-decoration: none; padding: 0.25rem 0.5rem; font-size: 0.75rem;">View PR</a>
                                </div>
                            </div>
                        `;
                        prsList.insertAdjacentHTML('afterbegin', newPRHtml);
                    }
                } else {
                    alert('❌ Failed to generate auto-fix PR: ' + data.message);
                }
            } catch (error) {
                console.error('Auto-fix PR error:', error);
                alert('❌ Error generating auto-fix PR. Please try again.');
            }
        }

        function showAddModal() {
            document.querySelector('[data-testid="add-repo-modal"]').classList.add('show');
        }

        function closeAddModal() {
            document.querySelector('[data-testid="add-repo-modal"]').classList.remove('show');
            document.querySelector('[data-testid="success-message"]').classList.add('d-none');
        }

        async function addRepo() {
            const url = document.querySelector('[data-testid="repo-url-input"]').value;
            const name = document.querySelector('[data-testid="repo-name-input"]').value;
            
            try {
                const response = await fetch('/api/repositories', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ url, name })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.querySelector('[data-testid="success-message"]').classList.remove('d-none');
                    setTimeout(() => {
                        closeAddModal();
                        loadRepositories();
                    }, 1500);
                }
            } catch (error) {
                console.error('Failed to add repository:', error);
            }
        }

        async function loadRepositories() {
            try {
                const response = await fetch('/api/repositories');
                const repos = await response.json();
                
                const container = document.getElementById('repo-items');
                const dashboardContainer = document.getElementById('dashboard-repo-items');
                
                const repoHTML = repos.map(repo => 
                    '<div class="list-item">' +
                        '<div class="list-item-content">' +
                            '<h3>' + repo.name + '</h3>' +
                            '<p>' + repo.url + '</p>' +
                        '</div>' +
                        '<span class="badge badge-primary">' + repo.alerts + ' alerts</span>' +
                    '</div>'
                ).join('');
                
                if (container) container.innerHTML = repoHTML;
                if (dashboardContainer) dashboardContainer.innerHTML = repoHTML;
                
            } catch (error) {
                console.error('Failed to load repositories:', error);
            }
        }

        async function loadAlerts() {
            try {
                const response = await fetch('/api/alerts');
                const alerts = await response.json();
                
                const criticalContainer = document.getElementById('critical-alerts-list');
                const highContainer = document.getElementById('high-alerts-list');
                
                const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
                const highAlerts = alerts.filter(alert => alert.severity === 'high');
                
                const criticalHTML = criticalAlerts.map(alert => 
                    '<div class="list-item alert-border-left alert-critical">' +
                        '<div class="list-item-content">' +
                            '<h3>' + alert.title + '</h3>' +
                            '<p>' + alert.description + '</p>' +
                        '</div>' +
                        '<span class="badge badge-danger">' + alert.repository + '</span>' +
                    '</div>'
                ).join('') || '<div class="list-item">No critical alerts</div>';
                
                const highHTML = highAlerts.map(alert => 
                    '<div class="list-item alert-border-left alert-high">' +
                        '<div class="list-item-content">' +
                            '<h3>' + alert.title + '</h3>' +
                            '<p>' + alert.description + '</p>' +
                        '</div>' +
                        '<span class="badge badge-warning">' + alert.repository + '</span>' +
                    '</div>'
                ).join('') || '<div class="list-item">No high priority alerts</div>';
                
                if (criticalContainer) criticalContainer.innerHTML = criticalHTML;
                if (highContainer) highContainer.innerHTML = highHTML;
                
            } catch (error) {
                console.error('Failed to load alerts:', error);
            }
        }

        async function loadDashboardData() {
            await Promise.all([loadRepositories(), loadAlerts()]);
        }

        function startScan() {
            const progressEl = document.querySelector('[data-testid="scan-progress"]');
            const buttonEl = document.querySelector('[data-testid="start-scan-button"]');
            
            progressEl.textContent = 'Scanning...';
            buttonEl.disabled = true;
            
            setTimeout(() => {
                progressEl.textContent = 'Scan completed';
                buttonEl.disabled = false;
            }, 3000);
        }

        // CRITICAL FIX: Enhanced routing with better page detection
        function handleRouting() {
            const path = window.location.pathname;
            console.log('🧭 Handling route:', path, 'Auth:', isAuthenticated);
            
            if (!isAuthenticated && path !== '/') {
                showPage('login-page');
                return;
            }
            
            switch (path) {
                case '/':
                    if (isAuthenticated) {
                        showPage('dashboard');
                        loadDashboardData();
                    } else {
                        showPage('homepage');
                    }
                    break;
                case '/dashboard':
                    showPage('dashboard');
                    if (isAuthenticated) loadDashboardData();
                    break;
                case '/repositories':
                    showPage('repositories-page');
                    if (isAuthenticated) loadRepositories();
                    break;
                case '/alerts':
                    showPage('alerts-section');
                    if (isAuthenticated) loadAlerts();
                    break;
                case '/notifications':
                    showPage('notifications-list');
                    break;
                case '/security-copilot':
                    showPage('security-copilot-page');
                    break;
                case '/auto-fix-prs':
                    showPage('auto-fix-prs-page');
                    break;
                case '/signup':
                    showPage('signup-page');
                    break;
                case '/login':
                    showPage('login-page');
                    break;
                default:
                    if (isAuthenticated) {
                        showPage('dashboard');
                        loadDashboardData();
                    } else {
                        showPage('homepage');
                    }
            }
        }

        // Navigation event handlers with preventDefault
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-testid="dashboard-nav"]')) {
                e.preventDefault();
                history.pushState(null, '', '/dashboard');
                handleRouting();
            } else if (e.target.matches('[data-testid="repos-nav"]')) {
                e.preventDefault();
                history.pushState(null, '', '/repositories');
                handleRouting();
            } else if (e.target.matches('[data-testid="alerts-nav"]')) {
                e.preventDefault();
                history.pushState(null, '', '/alerts');
                handleRouting();
            } else if (e.target.matches('[data-testid="notifs-nav"]')) {
                e.preventDefault();
                history.pushState(null, '', '/notifications');
                handleRouting();
            } else if (e.target.matches('[data-testid="copilot-nav"]')) {
                e.preventDefault();
                history.pushState(null, '', '/security-copilot');
                handleRouting();
            } else if (e.target.matches('[data-testid="autofix-nav"]')) {
                e.preventDefault();
                history.pushState(null, '', '/auto-fix-prs');
                handleRouting();
            }
        });

        // Browser navigation
        window.addEventListener('popstate', handleRouting);

        // CRITICAL: Proper app initialization
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 App initializing...');
            
            // Load theme
            const savedTheme = localStorage.getItem('theme') || 'light';
            currentTheme = savedTheme;
            document.body.className = currentTheme + '-theme';
            document.querySelector('.theme-toggle').textContent = currentTheme === 'light' ? '🌙' : '☀️';
            
            // Check authentication
            const token = localStorage.getItem('authToken');
            if (token) {
                console.log('🔐 Found auth token, user is authenticated');
                isAuthenticated = true;
            } else {
                console.log('🔒 No auth token, showing login');
                isAuthenticated = false;
            }
            
            // Initialize routing with a small delay to ensure DOM is ready
            setTimeout(() => {
                handleRouting();
            }, 100);
        });
    </script>
</body>
</html>`);
});

console.log(`🚀 DependencyWarden server starting on port ${port}`);
console.log(`📊 API endpoints available:`);
console.log(`   POST /api/auth/login - Authentication`);
console.log(`   GET  /api/repositories - List repositories`);
console.log(`   POST /api/repositories - Add repository`);
console.log(`   GET  /api/alerts - List all alerts`);
console.log(`   GET  /api/alerts/critical - Critical alerts`);
console.log(`   GET  /api/alerts/high - High priority alerts`);

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`🔍 Open your browser to test the application`);
}); 