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
    
    // Accept any email/password for testing
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
  // Don't serve the app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve the single-page application with comprehensive features
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DependencyWarden</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: var(--bg-color, #f5f5f5); 
            color: var(--text-color, #333);
            transition: all 0.3s ease;
          }
          
          /* Theme variables */
          .light-theme {
            --bg-color: #f5f5f5;
            --surface-color: white;
            --text-color: #333;
            --border-color: #ddd;
            --primary-color: #007bff;
            --primary-hover: #0056b3;
            --danger-color: #dc3545;
            --success-color: #28a745;
            --warning-color: #ffc107;
          }
          
          .dark-theme {
            --bg-color: #1a1a1a;
            --surface-color: #2d2d2d;
            --text-color: #f0f0f0;
            --border-color: #404040;
            --primary-color: #0d6efd;
            --primary-hover: #0b5ed7;
            --danger-color: #dc3545;
            --success-color: #198754;
            --warning-color: #ffc107;
          }
          
          nav { 
            background: var(--surface-color); 
            padding: 15px 20px; 
            margin-bottom: 20px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
          }
          
          nav .nav-links a { 
            margin-right: 20px; 
            text-decoration: none; 
            color: var(--text-color);
            font-weight: 500;
            padding: 8px 12px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }
          
          nav .nav-links a:hover {
            background-color: var(--border-color);
          }
          
          nav .nav-links a.active {
            background-color: var(--primary-color);
            color: white;
          }
          
          .user-menu { 
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .theme-toggle {
            background: var(--border-color);
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            color: var(--text-color);
            font-size: 14px;
          }
          
          .login-page { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 80vh; 
          }
          
          .login-form { 
            background: var(--surface-color); 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            max-width: 400px; 
            width: 100%;
            border: 1px solid var(--border-color);
          }
          
          .form-group { margin-bottom: 20px; }
          
          label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 500;
            color: var(--text-color);
          }
          
          input { 
            width: 100%; 
            padding: 12px; 
            border: 1px solid var(--border-color); 
            border-radius: 4px; 
            background: var(--surface-color);
            color: var(--text-color);
            font-size: 14px;
          }
          
          input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
          }
          
          button { 
            width: 100%; 
            padding: 12px; 
            background: var(--primary-color); 
            color: white; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          
          button:hover { background: var(--primary-hover); }
          
          .error { 
            color: var(--danger-color); 
            margin-top: 10px; 
            display: none;
            padding: 8px;
            background: rgba(220,53,69,0.1);
            border-radius: 4px;
            border: 1px solid var(--danger-color);
          }
          
          .success { 
            color: var(--success-color); 
            margin-top: 10px; 
            display: none;
            padding: 8px;
            background: rgba(40,167,69,0.1);
            border-radius: 4px;
            border: 1px solid var(--success-color);
          }
          
          .dashboard { 
            display: none; 
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: var(--surface-color);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 1px solid var(--border-color);
          }
          
          .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: var(--primary-color);
          }
          
          .repo-list, .alert-list {
            background: var(--surface-color);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid var(--border-color);
          }
          
          .repo-item, .alert-item {
            padding: 15px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .repo-item:last-child, .alert-item:last-child {
            border-bottom: none;
          }
          
          .alert-critical { border-left: 4px solid var(--danger-color); }
          .alert-high { border-left: 4px solid var(--warning-color); }
          
          .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
          }
          
          .modal-content {
            background-color: var(--surface-color);
            margin: 15% auto;
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 500px;
            border: 1px solid var(--border-color);
          }
          
          .btn-secondary {
            background: var(--border-color);
            color: var(--text-color);
          }
          
          .btn-danger {
            background: var(--danger-color);
          }
          
          /* Mobile responsive */
          @media (max-width: 768px) {
            nav {
              flex-direction: column;
              gap: 10px;
            }
            
            .nav-links {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            
            .nav-links a {
              margin-right: 0;
            }
            
            .dashboard {
              padding: 10px;
            }
            
            .stats-grid {
              grid-template-columns: 1fr;
            }
            
            .login-form {
              margin: 20px;
              padding: 20px;
            }
          }
          
          @media (max-width: 480px) {
            .repo-item, .alert-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }
            
            .modal-content {
              margin: 10% auto;
              width: 95%;
            }
          }
        </style>
      </head>
      <body class="light-theme">
        <div data-testid="app">
          <nav data-testid="navigation" style="display: none;">
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
          </nav>

          <!-- Login Page -->
          <div data-testid="login-page" class="login-page">
            <form data-testid="login-form" class="login-form" onsubmit="handleLogin(event)">
              <h1>DependencyWarden Login</h1>
              <div class="form-group">
                <label for="email">Email</label>
                <input data-testid="email-input" type="email" id="email" required placeholder="Enter your email" />
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input data-testid="password-input" type="password" id="password" required placeholder="Enter your password" />
              </div>
              <button data-testid="login-button" type="submit">Login</button>
              <div data-testid="login-error" class="error">Invalid credentials</div>
            </form>
          </div>

          <!-- Dashboard -->
          <div data-testid="dashboard" class="dashboard">
            <h1>Dashboard</h1>
            <div class="stats-grid">
              <div class="stat-card">
                <div data-testid="total-repos" class="stat-number">5</div>
                <div>Total Repositories</div>
              </div>
              <div class="stat-card">
                <div data-testid="active-alerts" class="stat-number">3</div>
                <div>Active Alerts</div>
              </div>
              <div class="stat-card">
                <div data-testid="critical-issues" class="stat-number">1</div>
                <div>Critical Issues</div>
              </div>
            </div>
            
            <div data-testid="dashboard-repo-list" class="repo-list">
              <h2>Recent Repositories</h2>
              <div class="repo-item">
                <span>Test Repository</span>
                <span>5 alerts</span>
              </div>
              <div class="repo-item">
                <span>Another Repo</span>
                <span>2 alerts</span>
              </div>
            </div>
            
            <div data-testid="vuln-summary" class="repo-list">
              <h2>Vulnerability Summary</h2>
              <div class="alert-item alert-critical">
                <span>Critical: 1</span>
              </div>
              <div class="alert-item alert-high">
                <span>High: 2</span>
              </div>
            </div>
          </div>

          <!-- Repositories Page -->
          <div data-testid="repositories-page" class="dashboard" style="display: none;">
            <h1>Repositories</h1>
            <button data-testid="add-repo-button" onclick="showAddModal()" style="margin-bottom: 20px;">Add Repository</button>
            
            <div data-testid="repo-list" class="repo-list">
              <h2>Your Repositories</h2>
              <div id="repo-items">
                <!-- Dynamically populated -->
              </div>
            </div>
            
            <!-- Add Repository Modal -->
            <div data-testid="add-repo-modal" class="modal">
              <div class="modal-content">
                <h2>Add New Repository</h2>
                <div class="form-group">
                  <label for="repo-url">Repository URL</label>
                  <input data-testid="repo-url-input" type="url" id="repo-url" placeholder="https://github.com/user/repo" />
                </div>
                <div class="form-group">
                  <label for="repo-name">Repository Name (optional)</label>
                  <input data-testid="repo-name-input" type="text" id="repo-name" placeholder="My Repository" />
                </div>
                <button data-testid="add-repo-submit" onclick="addRepo()">Add Repository</button>
                <button type="button" class="btn-secondary" onclick="closeAddModal()" style="margin-top: 10px;">Cancel</button>
                <div data-testid="success-message" class="success">Repository added successfully</div>
              </div>
            </div>
          </div>

          <!-- Alerts Page -->
          <div data-testid="alerts-section" class="dashboard" style="display: none;">
            <h1>Security Alerts</h1>
            
            <div data-testid="critical-alerts" class="alert-list">
              <h2>Critical Alerts</h2>
              <div id="critical-alerts-list">
                <!-- Dynamically populated -->
              </div>
            </div>
            
            <div data-testid="high-alerts" class="alert-list">
              <h2>High Priority Alerts</h2>
              <div id="high-alerts-list">
                <!-- Dynamically populated -->
              </div>
            </div>
            
            <div data-testid="scan-status" class="repo-list">
              <h2>Scan Status</h2>
              <div data-testid="scan-progress">Ready to scan</div>
              <button data-testid="start-scan-button" onclick="startScan()" style="margin-top: 10px;">Start New Scan</button>
            </div>
          </div>

          <!-- Notifications Page -->
          <div data-testid="notifications-list" class="dashboard" style="display: none;">
            <h1>Notifications</h1>
            <div class="repo-list">
              <h2>Recent Notifications</h2>
              <div class="alert-item">
                <span>New security alert for Test Repository</span>
                <small>2 hours ago</small>
              </div>
              <div class="alert-item">
                <span>Scan completed for Another Repo</span>
                <small>1 day ago</small>
              </div>
              <div class="alert-item">
                <span>Repository added successfully</span>
                <small>2 days ago</small>
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
            const pages = ['login-page', 'dashboard', 'repositories-page', 'alerts-section', 'notifications-list'];
            pages.forEach(page => {
              const el = document.querySelector('[data-testid="' + page + '"]');
              if (el) el.style.display = 'none';
            });
            
            // Show navigation if authenticated
            const nav = document.querySelector('[data-testid="navigation"]');
            if (nav) nav.style.display = isAuthenticated ? 'block' : 'none';
            
            // Show requested page
            const targetPage = document.querySelector('[data-testid="' + pageName + '"]');
            if (targetPage) targetPage.style.display = 'block';
            
            // Update active nav link
            if (isAuthenticated) {
              document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
              const activeLink = document.querySelector('[data-testid="' + pageName.replace('-page', '') + '-nav"]');
              if (activeLink) activeLink.classList.add('active');
              else if (pageName === 'dashboard') {
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
                errorEl.style.display = 'none';
                await loadDashboardData();
              } else {
                errorEl.style.display = 'block';
              }
            } catch (error) {
              console.error('Login error:', error);
              document.querySelector('[data-testid="login-error"]').style.display = 'block';
            }
          }
          
          function logout() {
            localStorage.removeItem('authToken');
            isAuthenticated = false;
            showPage('login-page');
          }
          
          function showAddModal() {
            document.querySelector('[data-testid="add-repo-modal"]').style.display = 'block';
          }
          
          function closeAddModal() {
            document.querySelector('[data-testid="add-repo-modal"]').style.display = 'none';
            document.querySelector('[data-testid="success-message"]').style.display = 'none';
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
                document.querySelector('[data-testid="success-message"]').style.display = 'block';
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
              const response = await fetch('/api/repositories', {
                headers: {
                  'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                }
              });
              const repos = await response.json();
              
              const container = document.getElementById('repo-items');
              container.innerHTML = repos.map(repo => 
                '<div class="repo-item">' +
                  '<div>' +
                    '<strong>' + repo.name + '</strong><br>' +
                    '<small>' + repo.url + '</small>' +
                  '</div>' +
                  '<span>' + repo.alerts + ' alerts</span>' +
                '</div>'
              ).join('');
            } catch (error) {
              console.error('Failed to load repositories:', error);
            }
          }
          
          async function loadAlerts() {
            try {
              const response = await fetch('/api/alerts', {
                headers: {
                  'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                }
              });
              const alerts = await response.json();
              
              const criticalContainer = document.getElementById('critical-alerts-list');
              const highContainer = document.getElementById('high-alerts-list');
              
              const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
              const highAlerts = alerts.filter(alert => alert.severity === 'high');
              
              criticalContainer.innerHTML = criticalAlerts.map(alert => 
                '<div class="alert-item alert-critical">' +
                  '<div>' +
                    '<strong>' + alert.title + '</strong><br>' +
                    '<small>' + alert.description + '</small>' +
                  '</div>' +
                  '<small>' + alert.repository + '</small>' +
                '</div>'
              ).join('') || '<div class="alert-item">No critical alerts</div>';
              
              highContainer.innerHTML = highAlerts.map(alert => 
                '<div class="alert-item alert-high">' +
                  '<div>' +
                    '<strong>' + alert.title + '</strong><br>' +
                    '<small>' + alert.description + '</small>' +
                  '</div>' +
                  '<small>' + alert.repository + '</small>' +
                '</div>'
              ).join('') || '<div class="alert-item">No high priority alerts</div>';
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
              buttonEl.textContent = 'Start New Scan';
            }, 3000);
          }
          
          // Handle routing
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
                  if (isAuthenticated) loadDashboardData();
                } else {
                  showPage('login-page');
                }
            }
          }
          
          // Navigation handlers
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
          
          // Handle browser back/forward
          window.addEventListener('popstate', handleRouting);
          
          // Initialize
          document.addEventListener('DOMContentLoaded', () => {
            // Load saved theme
            const savedTheme = localStorage.getItem('theme') || 'light';
            currentTheme = savedTheme;
            document.body.className = currentTheme + '-theme';
            document.querySelector('.theme-toggle').textContent = currentTheme === 'light' ? '🌙' : '☀️';
            
            // Check for existing auth token
            if (localStorage.getItem('authToken')) {
              isAuthenticated = true;
            }
            
            // Initialize page
            handleRouting();
          });
        </script>
      </body>
    </html>
  `);
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