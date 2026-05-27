const mongoose = require('mongoose');
const serverless = require('serverless-http');
const app = require('../../app');

let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI не установлен');
  }

  cachedConnection = await mongoose.connect(process.env.MONGODB_URI);
  return cachedConnection;
}

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  await connectToDatabase();

  return handler(event, context);
};
