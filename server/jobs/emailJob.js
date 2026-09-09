const { Queue, Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const { sendEmail } = require('../services/email.service');

let emailQueue = null;

const initQueue = () => {
  const redis = getRedis();
  if (!redis || emailQueue) return;
  try {
    emailQueue = new Queue('email', { connection: redis });
    const worker = new Worker('email', async (job) => {
      const { to, subject, html } = job.data;
      await sendEmail(to, subject, html);
    }, { connection: redis, concurrency: 5 });
    worker.on('failed', (job, err) => console.error(`Email job ${job.id} failed:`, err.message));
    console.log('[EmailJob] BullMQ queue ready');
  } catch {
    console.warn('[EmailJob] BullMQ not available — emails sent directly.');
  }
};

const enqueueEmail = async (to, subject, html, priority = 'normal') => {
  initQueue();
  if (emailQueue) {
    return emailQueue.add('send', { to, subject, html }, {
      priority: priority === 'high' ? 1 : 10,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
  try { await sendEmail(to, subject, html); } catch (err) { console.error('[Email] Direct send failed:', err.message); }
};

module.exports = { enqueueEmail };
