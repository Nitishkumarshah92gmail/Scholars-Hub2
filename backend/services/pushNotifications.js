/**
 * pushNotifications.js — Firebase Admin SDK wrapper
 *
 * Exports a single function: sendPushToToken({ token, title, body, data })
 *
 * SETUP:
 *   1. In Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Open the downloaded JSON and copy the three fields into your backend .env:
 *        FIREBASE_PROJECT_ID=your-project-id
 *        FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
 *        FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
 *      Note: wrap FIREBASE_PRIVATE_KEY in double quotes and use literal \n (not real newlines)
 *        in the .env file — the code below handles converting \n → newlines.
 *
 * BEHAVIOUR:
 *  - If the env vars are missing, the module initialises in "disabled" mode:
 *    all calls to sendPushToToken() are silent no-ops. The server still starts normally.
 *  - If FCM rejects a token (e.g. app uninstalled), it logs a warning but does not throw.
 *
 * INSTALL:
 *   cd backend && npm install firebase-admin
 */

const admin = require('firebase-admin');

// ── Lazy initialisation ───────────────────────────────────────────────────────
let _app = null;
let _messaging = null;
let _disabled = false;

function getMessaging() {
  if (_disabled) return null;
  if (_messaging) return _messaging;

  const projectId    = (process.env.FIREBASE_PROJECT_ID    || '').trim();
  const clientEmail  = (process.env.FIREBASE_CLIENT_EMAIL  || '').trim();
  // .env stores \n as a literal two-char sequence; convert back to real newlines
  const privateKey   = (process.env.FIREBASE_PRIVATE_KEY   || '').trim().replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '⚠️  [PushNotifications] Firebase credentials not configured — push notifications disabled.\n' +
      '   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in your backend .env.'
    );
    _disabled = true;
    return null;
  }

  try {
    // Only initialise once, even if this module is required multiple times
    _app = admin.apps.length
      ? admin.apps[0]
      : admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });

    _messaging = admin.messaging(_app);
    console.log('✅ [PushNotifications] Firebase Admin SDK initialised.');
    return _messaging;
  } catch (err) {
    console.error('❌ [PushNotifications] Failed to initialise Firebase Admin SDK:', err.message);
    _disabled = true;
    return null;
  }
}

/**
 * Send a push notification to a single FCM token.
 *
 * @param {object} opts
 * @param {string}  opts.token  - FCM registration token for the target device
 * @param {string}  opts.title  - Notification title (shown in tray)
 * @param {string}  opts.body   - Notification body text
 * @param {object} [opts.data]  - Optional key-value payload (e.g. { postId, type })
 *                                Values must all be strings.
 * @returns {Promise<void>}
 */
async function sendPushToToken({ token, title, body, data = {} }) {
  const messaging = getMessaging();
  if (!messaging || !token) return;

  // Ensure all data values are strings (FCM requirement)
  const stringData = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined) stringData[k] = String(v);
  }

  const message = {
    token,
    notification: { title, body },
    data: stringData,
    android: {
      // Delivery priority — high wakes the device immediately
      priority: 'high',
      notification: {
        // Sound & channel for Android 8+ notification channels
        sound: 'default',
        channelId: 'studyshare_default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK', // handled by Capacitor
      },
    },
  };

  try {
    const response = await messaging.send(message);
    console.log(`[PushNotifications] Message sent: ${response}`);
  } catch (err) {
    // Stale tokens (app uninstalled) should be cleaned up from DB, but
    // we treat all FCM errors as non-fatal so the API call still succeeds.
    if (err.code === 'messaging/registration-token-not-registered') {
      console.warn(`[PushNotifications] Token stale/unregistered — removing: ${token.slice(0, 20)}…`);
      // Best-effort cleanup of the stale token
      try {
        const supabase = require('../config/supabase');
        if (supabase) {
          await supabase.from('device_tokens').delete().eq('fcm_token', token);
        }
      } catch { /* ignore cleanup errors */ }
    } else {
      console.error('[PushNotifications] send error:', err.message);
    }
  }
}

/**
 * Look up all FCM tokens for a given user and send them a push notification.
 * Silently no-ops if the user has no registered devices or Firebase is disabled.
 *
 * @param {object} opts
 * @param {string}  opts.userId - Supabase user UUID of the recipient
 * @param {string}  opts.title
 * @param {string}  opts.body
 * @param {object} [opts.data]
 * @returns {Promise<void>}
 */
async function sendPushToUser({ userId, title, body, data = {} }) {
  if (!userId) return;
  const messaging = getMessaging();
  if (!messaging) return;

  try {
    const supabase = require('../config/supabase');
    if (!supabase) return;

    const { data: rows, error } = await supabase
      .from('device_tokens')
      .select('fcm_token')
      .eq('user_id', userId);

    if (error || !rows || rows.length === 0) return;

    // Fire all tokens in parallel; errors are handled inside sendPushToToken
    await Promise.all(
      rows.map(({ fcm_token }) => sendPushToToken({ token: fcm_token, title, body, data }))
    );
  } catch (err) {
    console.error('[PushNotifications] sendPushToUser error:', err.message);
  }
}

module.exports = { sendPushToToken, sendPushToUser };
