const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = process.env.PORT || 3000;
let MONGODB_URI = process.env.MONGODB_URI || '';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function startMongoIfNeeded() {
  if (MONGODB_URI) {
    return null;
  }
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'barcode-generator' }
  });
  MONGODB_URI = mongod.getUri();
  console.log('Started in-memory MongoDB at', MONGODB_URI);
  return mongod;
}

async function start() {
  const mongod = await startMongoIfNeeded();

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API routes (mount before Next handler)
  const barcodeRouter = require('./routes/barcode');
  app.use('/api/barcodes', barcodeRouter);

  // Serve uploads
  app.use('/uploads', express.static(UPLOAD_DIR));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Integrate Next.js for the UI (client folder)
  const nextDir = path.join(__dirname, 'client');
  if (fs.existsSync(nextDir)) {
    const next = require('next');
    const dev = process.env.NODE_ENV !== 'production';
    const nextApp = next({ dev, dir: nextDir });
    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    // Let Next handle any non-API/static requests
    app.all('*', (req, res) => {
      // If the request is for API or uploads, those were already handled above.
      return handle(req, res);
    });
  } else {
    // If no client exists, serve a minimal message
    app.get('/', (req, res) => {
      res.send('Barcode Generator server is running. Add a Next.js client in /client to serve a UI.');
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    if (process.send) {
      process.send({ type: 'ready', port: PORT });
    }
  });

  function shutdown() {
    console.log('Shutting down server...');
    server.close(async () => {
      await mongoose.disconnect();
      if (mongod) {
        await mongod.stop();
      }
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});