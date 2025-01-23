const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const { MongoClient } = require('mongodb'); // Using native MongoDB driver
const cors = require('cors');
require('dotenv').config();

// Ensure dotenv has loaded environment variables
if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in .env file.');
  process.exit(1);
}

// Load Proto file for gRPC
const PROTO_PATH = './proto/questsearch.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const questionProto = grpc.loadPackageDefinition(packageDefinition);
const client = new questionProto.QuestSearch('0.0.0.0:50051', grpc.credentials.createInsecure());

// Express Setup
const app = express();
app.use(cors({
  origin: ['http://0.0.0.0:0', 'http://localhost:3000', "https://questsearch-speakx.vercel.app"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// MongoDB Atlas Setup (using native driver)
const mongoURI = process.env.MONGO_URI;
const clientDB = new MongoClient(mongoURI);

clientDB.connect()
  .then(() => console.log('Connected to MongoDB Atlas successfully'))
  .catch((err) => {
    console.error('Error connecting to MongoDB Atlas:', err.message);
    process.exit(1);
  });

// gRPC Server Setup
const server = new grpc.Server();

server.addService(questionProto.QuestSearch.service, {
  searchQuestions: async (call, callback) => {
    try {
      const { query, page = 1, pageSize = 10, type } = call.request;

      // Calculate the skip value for pagination
      const skip = (page - 1) * pageSize;

      const database = clientDB.db();
      const collection = database.collection('questions');

      // Build the MongoDB aggregation pipeline
      const agg = [
        {
          $search: {
            index: "standard",  // Atlas Search index
            text: {
              query,
              path: 'title',  // Search in the 'title' field
            },
          },
        },
        ...(type ? [{ $match: { type: type } }] : []),  // Add type match dynamically
        { $skip: skip },  // Skip based on current page
        { $limit: pageSize },  // Limit the number of results per page
      ];

      const results = await collection.aggregate(agg).toArray();

      // Send back results to the frontend
      callback(null, { questions: results });
    } catch (error) {
      console.error('Error during searchQuestions:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: `Error during search: ${error.message}`
      });
    }
  },
});

// Start the gRPC server
const GRPC_PORT = process.env.GRPC_PORT || 50051;
server.bindAsync('0.0.0.0:' + GRPC_PORT, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`gRPC server running on port ${GRPC_PORT}`);
  server.start();
});

const EXPRESS_PORT = process.env.PORT || 3000;
app.listen(EXPRESS_PORT, () => {
  console.log(`Express server running on port ${EXPRESS_PORT}`);
});

// Express API endpoint to search for questions with pagination
app.post('/api/search', async (req, res) => {
  const { query, page = 1, pageSize = 10, type } = req.body;  // Include 'type' in request body

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Calculate skip for pagination
    const skip = (page - 1) * pageSize;
    const database = clientDB.db();
    const collection = database.collection('questions');

    // Base aggregation pipeline
    const agg = [
      {
        $search: {
          index: "standard",  // Atlas Search index
          text: {
            query,
            path: 'title',  // Search in 'title' field
          },
        },
      },
      ...(type ? [{ $match: { type: type } }] : []),  // Add type match dynamically
      { $skip: skip },  // Skip based on current page
      { $limit: pageSize },  // Limit the number of results per page
    ];

    const results = await collection.aggregate(agg).toArray();

    // Send back results to the frontend
    res.json({ questions: results });
  } catch (error) {
    console.error('Error during search:', error.message);
    res.status(500).json({ error: 'Error fetching search results' });
  }
});
