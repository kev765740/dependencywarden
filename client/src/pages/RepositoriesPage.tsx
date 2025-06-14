import React, { useState } from 'react';

const RepositoriesPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: repoUrl }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Repository added successfully');
        setShowAddModal(false);
        setRepoUrl('');
      }
    } catch (error) {
      console.error('Failed to add repository:', error);
    }
  };

  return (
    <div data-testid="repositories-page">
      <h1>Repositories</h1>
      <button data-testid="add-repo-button" onClick={() => setShowAddModal(true)}>
        Add Repository
      </button>

      {showAddModal && (
        <div data-testid="add-repo-modal">
          <h2>Add New Repository</h2>
          <form onSubmit={handleAddRepository}>
            <input
              data-testid="repo-url-input"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Repository URL"
              required
            />
            <button data-testid="add-repo-submit" type="submit">
              Add Repository
            </button>
          </form>
        </div>
      )}

      {successMessage && (
        <div data-testid="success-message">{successMessage}</div>
      )}

      <div data-testid="repo-list">
        <h2>Your Repositories</h2>
        <ul>
          <li>Test Repository</li>
        </ul>
      </div>
    </div>
  );
};

export default RepositoriesPage; 