import { Router } from 'express';
import jwt from 'jsonwebtoken';

import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', async (req, res) => {
  // Implementation will be added later
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/logout', async (req, res) => {
  // Implementation will be added later
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/refresh', async (req, res) => {
  // Implementation will be added later
  res.status(501).json({ error: 'Not implemented' });
});

export const authRouter = router; 