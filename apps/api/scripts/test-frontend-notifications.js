#!/usr/bin/env node

/**
 * Frontend Irrigation Test Helper
 * Simulates WebSocket notifications for frontend testing
 */

const { io } = require('socket.io-client');

const WS_URL = process.env.WS_URL || 'http://localhost:5000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

// Simulated irrigation notifications
const notifications = [
  {
    type: 'automatic',
    message: 'Bomba ativada por 30 segundos - 2.5L de água',
    irrigationId: 'auto-irrigation-001',
    userId: TEST_USER_ID,
    timestamp: new Date().toISOString(),
    data: {
      duration: 30000,
      waterAmount: 2.5,
      greenhouseName: 'Estufa Principal'
    }
  },
  {
    type: 'manual',
    message: 'Irrigação detectada - umidade do solo aumentou significativamente',
    irrigationId: 'manual-irrigation-001',
    userId: TEST_USER_ID,
    timestamp: new Date().toISOString(),
    data: {
      soilMoistureIncrease: 25,
      greenhouseName: 'Estufa Principal'
    }
  }
];

function simulateNotifications() {
  console.log('🔌 Connecting to WebSocket server...');

  const socket = io(WS_URL, {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('📡 Connected to WebSocket server');
    console.log(`👤 Simulating notifications for user: ${TEST_USER_ID}`);

    // Send notifications with delays
    let index = 0;
    const sendNotification = () => {
      if (index < notifications.length) {
        const notification = notifications[index];
        console.log(`\n🔔 Sending notification ${index + 1}/${notifications.length}`);
        console.log(`   Type: ${notification.type}`);
        console.log(`   Message: ${notification.message}`);

        socket.emit('irrigation-detected', notification);

        index++;
        setTimeout(sendNotification, 3000); // 3 seconds between notifications
      } else {
        console.log('\n✅ All notifications sent!');
        console.log('💡 Check your frontend application for received notifications');
        setTimeout(() => {
          socket.disconnect();
          process.exit(0);
        }, 1000);
      }
    };

    // Start sending notifications
    setTimeout(sendNotification, 1000);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ WebSocket connection error:', error.message);
    process.exit(1);
  });

  socket.on('disconnect', () => {
    console.log('📡 Disconnected from WebSocket server');
  });
}

function showUsage() {
  console.log(`
🌧️  Frontend Irrigation Test Helper

Usage:
  node test-frontend-notifications.js

Environment Variables:
  WS_URL        WebSocket server URL (default: http://localhost:5000)
  TEST_USER_ID  User ID to simulate notifications for

What it does:
1. Connects to the WebSocket server
2. Simulates irrigation notifications
3. Sends notifications to test frontend reception

Make sure:
- Frontend application is running
- User is logged in and connected to WebSocket
- Check browser console for received notifications

Example:
  WS_URL=http://localhost:5000 TEST_USER_ID=user-123 node test-frontend-notifications.js
`);
}

// Handle script execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  console.log('🚀 Starting Frontend Irrigation Notification Test\n');
  simulateNotifications();
}

module.exports = {
  simulateNotifications,
  notifications
};