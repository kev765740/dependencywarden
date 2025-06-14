import React from 'react';

const AlertsPage = () => {
  return (
    <div data-testid="alerts-section">
      <h1>Security Alerts</h1>
      <div data-testid="critical-alerts">
        <h2>Critical Alerts</h2>
        <ul>
          <li>Security vulnerability in dependency</li>
        </ul>
      </div>
      <div data-testid="high-alerts">
        <h2>High Alerts</h2>
        <ul>
          <li>Outdated package version</li>
        </ul>
      </div>
      <div data-testid="scan-status">
        <h2>Scan Status</h2>
        <div data-testid="scan-progress">In Progress</div>
        <button data-testid="start-scan-button">Start New Scan</button>
      </div>
    </div>
  );
};

export default AlertsPage; 