import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock data
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

// Auth routes
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

// Repository routes
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
      name: name || `Repository ${repositories.length + 1}`,
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

// Alerts routes
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

// Serve the main application
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
            --info-color: #17a2b8;
            --light-color: #f8f9fa;
            --dark-color: #343a40;
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            transition: all 0.3s ease;
        }

        /* Navigation */
        nav {
            background: var(--surface-color);
            padding: 1rem 2rem;
            box-shadow: var(--shadow);
            border-bottom: 1px solid var(--border-color);
            position: sticky;
            top: 0;
            z-index: 100;
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

        /* Main Content */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .page {
            display: none;
        }

        .page.active {
            display: block;
        }

        /* Login Page */
        .login-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
        }

        .login-form {
            background: var(--surface-color);
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            width: 100%;
            max-width: 400px;
            border: 1px solid var(--border-color);
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
        }

        .btn-secondary:hover {
            background-color: #545b62;
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
            z-index: 1000;
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
    <div data-testid="app">
        <!-- Navigation -->
        <nav data-testid="navigation" class="d-none">
            <div class="nav-container">
                <div class="nav-links">
                    <a data-testid="dashboard-nav" href="/dashboard">Dashboard</a>
                    <a data-testid="repos-nav" href="/repositories">Repositories</a>
                    <a data-testid="alerts-nav" href="/alerts">Alerts</a>
                    <a data-testid="notifs-nav" href="/notifications">Notifications</a>
                </div>
                <div data-testid="user-menu" class="user-menu">
                    <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
                    <button onclick="logout()">Logout</button>
                </div>
            </div>
        </nav>

        <!-- Login Page -->
        <div data-testid="login-page" class="page login-container">
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

        <!-- Repositories Page -->
        <div data-testid="repositories-page" class="page">
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

        <!-- Alerts Page -->
        <div data-testid="alerts-section" class="page">
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

        <!-- Notifications Page -->
        <div data-testid="notifications-list" class="page">
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

        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.className = currentTheme + '-theme';
            localStorage.setItem('theme', currentTheme);
            
            const themeButton = document.querySelector('.theme-toggle');
            themeButton.textContent = currentTheme === 'light' ? '🌙' : '☀️';
        }

        function showPage(pageName) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show/hide navigation
            const nav = document.querySelector('[data-testid="navigation"]');
            if (isAuthenticated) {
                nav.classList.remove('d-none');
            } else {
                nav.classList.add('d-none');
            }
            
            // Show requested page
            const targetPage = document.querySelector('[data-testid="' + pageName + '"]');
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Update active nav link
            if (isAuthenticated) {
                document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
                const activeLink = document.querySelector('[data-testid="' + pageName.replace('-page', '') + '-nav"]');
                if (activeLink) {
                    activeLink.classList.add('active');
                } else if (pageName === 'dashboard') {
                    document.querySelector('[data-testid="dashboard-nav"]').classList.add('active');
                }
            }
        }

        async function handleLogin(event) {
            event.preventDefault();
            const email = document.querySelector('[data-testid="email-input"]').value;
            const password = document.querySelector('[data-testid="password-input"]').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                const errorEl = document.querySelector('[data-testid="login-error"]');
                
                if (data.success) {
                    localStorage.setItem('authToken', data.token);
                    isAuthenticated = true;
                    showPage('dashboard');
                    errorEl.classList.add('d-none');
                    await loadDashboardData();
                } else {
                    errorEl.classList.remove('d-none');
                }
            } catch (error) {
                console.error('Login error:', error);
                document.querySelector('[data-testid="login-error"]').classList.remove('d-none');
            }
        }

        function logout() {
            localStorage.removeItem('authToken');
            isAuthenticated = false;
            showPage('login-page');
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

        // Routing
        function handleRouting() {
            const path = window.location.pathname;
            
            if (!isAuthenticated && path !== '/') {
                showPage('login-page');
                return;
            }
            
            switch (path) {
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
                default:
                    if (isAuthenticated) {
                        showPage('dashboard');
                        loadDashboardData();
                    } else {
                        showPage('login-page');
                    }
            }
        }

        // Navigation event handlers
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
            }
        });

        // Browser navigation
        window.addEventListener('popstate', handleRouting);

        // Initialize app
        document.addEventListener('DOMContentLoaded', () => {
            // Load theme
            const savedTheme = localStorage.getItem('theme') || 'light';
            currentTheme = savedTheme;
            document.body.className = currentTheme + '-theme';
            document.querySelector('.theme-toggle').textContent = currentTheme === 'light' ? '🌙' : '☀️';
            
            // Check auth
            if (localStorage.getItem('authToken')) {
                isAuthenticated = true;
            }
            
            // Initialize
            handleRouting();
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