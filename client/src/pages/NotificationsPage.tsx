import React from 'react';

const NotificationsPage = () => {
  return (
    <div>
      <h1>Notifications</h1>
      <div data-testid="notifications-list">
        <h2>Recent Notifications</h2>
        <ul>
          <li>New security alert for Repository 1</li>
          <li>Scan completed for Repository 2</li>
          <li>New dependency update available</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationsPage; 