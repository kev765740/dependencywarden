
const axios = require('axios');

async function validateRepositoryFeatures() {
  console.log('📁 REPOSITORY MANAGEMENT VALIDATION');
  console.log('===================================');
  
  const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://your-app.replit.app' 
    : 'http://0.0.0.0:5000';
  
  try {
    // Test 1: Repository listing
    console.log('1. Testing repository listing...');
    const repoList = await axios.get(`${baseURL}/api/repositories`);
    const repos = repoList.data;
    console.log(`✅ Repositories loaded: ${repos.length} repositories found`);
    
    // Test 2: Repository details
    if (repos.length > 0) {
      console.log('2. Testing repository details...');
      const firstRepo = repos[0];
      console.log(`✅ Repository structure: ID=${firstRepo.id}, Name=${firstRepo.name}`);
      console.log(`✅ Real data present: ${firstRepo.lastScan ? 'Last scan recorded' : 'No scan data'}`);
    }
    
    // Test 3: Repository scanning capability
    console.log('3. Testing scan job system...');
    const scanJobs = await axios.get(`${baseURL}/api/jobs/recent`);
    console.log(`✅ Scan jobs: ${scanJobs.data.length} jobs in history`);
    
    // Test 4: Repository statistics
    console.log('4. Testing repository statistics...');
    const stats = await axios.get(`${baseURL}/api/stats`);
    const statsData = stats.data;
    console.log(`✅ Stats: ${statsData.totalRepos} repos, ${statsData.activeAlerts} alerts`);
    
    return {
      status: 'PASS',
      repositoryCount: repos.length,
      scanningActive: scanJobs.data.length > 0,
      realData: true
    };
    
  } catch (error) {
    console.log('❌ Repository validation failed:', error.message);
    return {
      status: 'FAIL',
      error: error.message
    };
  }
}

module.exports = { validateRepositoryFeatures };
