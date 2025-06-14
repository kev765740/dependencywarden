import { Router } from 'express';
import { RepoModel } from '../db/repositories';
import { scanPackageVulnerabilities } from '../services/osv';
import { sendSlackNotification, sendEmailNotification } from '../services/notifications';
import { validateAuthToken } from '../middleware/auth';
import { Vulnerability } from '../types';

const router = Router();

// Authentication middleware
router.use(validateAuthToken);

// Validate GitHub repository URL
function isValidGitHubUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length === 3;
  } catch {
    return false;
  }
}

// List repositories
router.get('/', async (req, res) => {
  try {
    const repositories = await RepoModel.find({ userId: req.user!.id });
    res.json(repositories);
  } catch (error) {
    console.error('Failed to fetch repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Add repository
router.post('/add', async (req, res) => {
  try {
    const { url, isPrivate, slackChannel, emailNotifications } = req.body;

    // Validate URL format
    if (!isValidGitHubUrl(url)) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }

    // Check for private repositories
    if (isPrivate) {
      return res.status(403).json({ error: 'Private repository' });
    }

    try {
      // Create repository
      const repo = await RepoModel.create({
        userId: req.user!.id,
        url,
        isPrivate,
        slackChannel,
        emailNotifications,
        owner: url.split('/')[3],
        name: url.split('/')[4]
      });

      res.status(201).json(repo);
    } catch (dbError: any) {
      if (dbError.name === 'DuplicateError') {
        return res.status(409).json({ error: 'Repository already exists' });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Failed to create repository:', error);
    res.status(500).json({ error: 'Failed to create repository' });
  }
});

// Update repository
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slackChannel, emailNotifications, isPrivate } = req.body;

    // Validate input types
    if (isPrivate !== undefined && typeof isPrivate !== 'boolean') {
      return res.status(400).json({ error: 'Invalid type for isPrivate field' });
    }

    // Find repository
    const repo = await RepoModel.findOne({ _id: id });
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    // Check ownership
    if (repo.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this repository' });
    }

    // Update repository (only allowed fields)
    const updatedRepo = await RepoModel.findByIdAndUpdate(
      id,
      {
        $set: {
          slackChannel,
          emailNotifications,
          isPrivate
        }
      }
    );

    if (!updatedRepo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    res.json(updatedRepo);
  } catch (error) {
    console.error('Failed to update repository:', error);
    res.status(500).json({ error: 'Failed to update repository' });
  }
});

// Delete repository
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find repository
    const repo = await RepoModel.findOne({ _id: id });
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    // Check ownership
    if (repo.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this repository' });
    }

    try {
      // Delete repository
      await RepoModel.findByIdAndDelete(id);
      res.status(204).send();
    } catch (dbError) {
      res.status(500).json({
        error: 'Failed to delete repository',
        details: 'Database constraint error'
      });
    }
  } catch (error) {
    console.error('Failed to delete repository:', error);
    res.status(500).json({
      error: 'Failed to delete repository',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Scan repository
router.post('/:id/scan', async (req, res) => {
  try {
    const { id } = req.params;

    // Find repository
    const repo = await RepoModel.findOne({ _id: id });
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    // Check ownership
    if (repo.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to scan this repository' });
    }

    try {
      // Scan repository
      const result = await scanPackageVulnerabilities(repo.url);
      const vulnerabilities = (result as { vulns: Vulnerability[] }).vulns || [];

      // Send notifications for critical vulnerabilities
      let notificationsSent = false;
      if (vulnerabilities.some((v: Vulnerability) => v.severity === 'CRITICAL')) {
        if (repo.slackChannel) {
          await sendSlackNotification(repo.slackChannel, vulnerabilities);
        }
        if (repo.emailNotifications) {
          await sendEmailNotification(repo.userId, vulnerabilities);
        }
        notificationsSent = true;
      }

      res.json({
        status: 'completed',
        vulnerabilities,
        vulnerabilitiesFound: vulnerabilities.length,
        notificationsSent
      });
    } catch (scanError) {
      res.status(500).json({
        error: 'Scan failed',
        details: 'OSV API error'
      });
    }
  } catch (error) {
    console.error('Failed to scan repository:', error);
    res.status(500).json({
      error: 'Scan failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as repoRouter };