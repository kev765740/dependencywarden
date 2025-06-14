import React from 'react';

const TestPage: React.FC = () => {
  // Safely access environment variables
  const getEnvMode = () => {
    try {
      return import.meta.env?.MODE || 'development';
    } catch {
      return 'unknown';
    }
  };

  const envVars = import.meta.env || {};

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">DependencyWarden Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>✅ React App is running successfully!</strong>
        </div>

        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <h3 className="font-semibold mb-2">Environment Info:</h3>
          <ul className="space-y-1">
            <li>Vite Mode: {getEnvMode()}</li>
            <li>Node Environment: {typeof process !== 'undefined' ? process.env?.NODE_ENV || 'browser' : 'browser'}</li>
            <li>Available env variables: {Object.keys(envVars).length}</li>
          </ul>
        </div>

        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>This test page verifies that the application is properly configured and running.</p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;