export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role?: string;
  githubId?: string;
  githubToken?: string;
  slackWebhookUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 