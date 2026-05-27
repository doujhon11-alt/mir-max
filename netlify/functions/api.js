const mongoose = require('mongoose');
const serverless = require('serverless-http');
const app = require('../../app');

let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000
  });
  return cachedConnection;
}

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    if (event.path.endsWith('/health')) {
      return handler(event, context);
    }

    await connectToDatabase();

    return handler(event, context);
  } catch (error) {
    console.error('Netlify Function error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Ошибка backend function',
        error: error.message
      })
    };
  }
};
