#!/usr/bin/env node
/**
 * Cron script to trigger marketplace sync
 * Railway cron should run: node scripts/cron-sync.mjs
 */

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function triggerSync() {
  if (!CRON_SECRET) {
    console.error('[Cron] Error: CRON_SECRET not set');
    process.exit(1);
  }

  const url = `${APP_URL}/api/sync`;
  console.log(`[Cron] Triggering sync at ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Cron] Sync failed with status ${response.status}:`, data);
      process.exit(1);
    }

    console.log('[Cron] Sync completed successfully:', JSON.stringify(data.summary, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('[Cron] Error triggering sync:', error.message);
    process.exit(1);
  }
}

triggerSync();
