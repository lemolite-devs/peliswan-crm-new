# Firebase Cloud Messaging (FCM) Setup Guide

This guide will help you set up Firebase Cloud Messaging for push notifications in your Peliswan CRM application.

## Prerequisites

1. Firebase project with Cloud Messaging enabled
2. Firebase Admin SDK service account key
3. VAPID key for web push notifications

## Backend Setup

### 1. Install Dependencies

```bash
cd back-end
npm install firebase-admin
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Service Account)
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
```

### 3. Get Firebase Admin SDK Credentials

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the following values:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `project_id` → `FIREBASE_PROJECT_ID`

### 4. Database Migration

The Users model has been updated to include FCM token and notification settings. If you have existing users, you may need to run a migration:

```javascript
// Optional: Update existing users with default notification settings
db.users.updateMany(
  { notificationSettings: { $exists: false } },
  {
    $set: {
      notificationSettings: {
        chat: true,
        leads: true,
        announcements: true,
        tasks: true,
      },
    },
  }
);
```

## Frontend Setup

### 1. Environment Variables

Add the following environment variables to your frontend `.env` file:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key
```

### 2. Get VAPID Key

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Scroll down to "Web configuration"
3. Generate a new key pair if you don't have one
4. Copy the "Key pair" → `REACT_APP_FIREBASE_VAPID_KEY`

### 3. Update Service Worker

Update the Firebase configuration in `public/firebase-messaging-sw.js`:

```javascript
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
};
```

## Features Implemented

### 1. FCM Token Management

- Automatic token generation and storage
- Token refresh handling
- Server-side token updates

### 2. Notification Settings

- User-configurable notification preferences
- Per-category settings (chat, leads, announcements, tasks)
- Settings persistence

### 3. Push Notifications

- Real-time chat notifications
- File message notifications
- Custom notification content
- Click handling and navigation

### 4. API Endpoints

#### FCM Token Management

- `PUT /api/notifications/fcm-token` - Update user's FCM token

#### Notification Settings

- `GET /api/notifications/settings` - Get user's notification settings
- `PUT /api/notifications/settings` - Update notification settings

#### Send Notifications

- `POST /api/notifications/send/user/:userId` - Send to specific user
- `POST /api/notifications/send/multiple` - Send to multiple users
- `POST /api/notifications/send/all` - Send to all users

## Usage Examples

### Sending a Chat Notification

```javascript
// Automatically sent when a message is sent via Socket.IO
// No additional code needed
```

### Sending a Custom Notification

```javascript
// Backend
import { sendNotificationToUsers } from "./services/notifications.js";

await sendNotificationToUsers([userId], {
  title: "New Lead Assigned",
  body: "You have been assigned a new lead",
  type: "leads",
  data: {
    leadId: "lead_id_here",
    path: "leads",
  },
});
```

### Frontend Notification Handling

```javascript
// The useFCM hook automatically handles:
// - Permission requests
// - Token generation
// - Foreground message handling
// - Settings management

import useFCM from "app/hooks/useFCM";

const { token, notification, requestPermission } = useFCM();
```

## Testing

### 1. Test Token Generation

1. Open browser console
2. Check for FCM token generation logs
3. Verify token is stored in database

### 2. Test Permission Request

1. Click notification settings icon
2. Grant notification permission
3. Verify settings are saved

### 3. Test Push Notifications

1. Send a message in chat
2. Check if other users receive notifications
3. Test notification click navigation

### 4. Test Background Notifications

1. Close the browser tab
2. Send a message from another user
3. Check if notification appears

## Troubleshooting

### Common Issues

1. **"Firebase not initialized"**

   - Check environment variables
   - Verify Firebase configuration

2. **"Permission denied"**

   - Check browser notification settings
   - Request permission manually

3. **"Token not generated"**

   - Check VAPID key configuration
   - Verify service worker registration

4. **"Notifications not received"**
   - Check user notification settings
   - Verify FCM token is valid
   - Check server logs for errors

### Debug Logs

Enable debug logging by checking browser console and server logs for:

- FCM token generation
- Permission requests
- Notification sending attempts
- Error messages

## Security Considerations

1. **VAPID Key**: Keep your VAPID key secure and don't expose it in client-side code
2. **Service Account**: Never commit service account keys to version control
3. **Token Validation**: Validate FCM tokens on the server before sending notifications
4. **Rate Limiting**: Implement rate limiting for notification sending endpoints

## Performance Optimization

1. **Batch Notifications**: Send notifications in batches for multiple users
2. **Token Cleanup**: Regularly clean up invalid FCM tokens
3. **Caching**: Cache user notification settings
4. **Error Handling**: Implement proper error handling for failed notifications

## Browser Support

- Chrome 42+
- Firefox 44+
- Safari 16+
- Edge 17+

Note: Push notifications require HTTPS in production environments.
