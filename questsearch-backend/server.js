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
const client = new questionProto.QuestSearch('localhost:50051', grpc.credentials.createInsecure());

// Express Setup
const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],  // Allow both origins
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
      const { query, page = 1, pageSize = 10 } = call.request;

      // Calculate the skip value for pagination
      const skip = (page - 1) * pageSize;

      const database = clientDB.db();
      const collection = database.collection('questions');

      // MongoDB aggregation with $skip and $limit for pagination
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
const GRPC_PORT = 50051;
server.bindAsync('0.0.0.0:' + GRPC_PORT, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`gRPC server running on port ${GRPC_PORT}`);
  server.start();
});

// Start Express server
const EXPRESS_PORT = 3000;
app.listen(EXPRESS_PORT, () => {
  console.log(`Express server running on port ${EXPRESS_PORT}`);
});

// Express API endpoint to search for questions with pagination
app.post('/api/search', async (req, res) => {
  console.log("API search endpoint hit");  // Log when the endpoint is hit
  const { query, page = 1, pageSize = 10 } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  console.log("Received query:", query); // Log the query received from frontend
  console.log("Page:", page);  // Log the page
  console.log("Page Size:", pageSize);  // Log the page size
  
  try {
    // Calculate skip for pagination
    const skip = (page - 1) * pageSize;
    console.log("Skip:", skip);  // Log the skip value for debugging

    const database = clientDB.db();
    const collection = database.collection('questions');

    // Ensure the query object is in the correct structure
    const agg = [
      {
        $search: {
          index: "standard",  // Atlas Search index
          text: {
            query,
            path: 'title',  // Search in 'title' field (ensure this field exists in your documents)
          },
        },
      },
      { $skip: skip },  // Skip based on current page
      { $limit: pageSize },  // Limit the number of results per page
    ];

    // Log the aggregation pipeline to debug the query
    console.log('Aggregation pipeline:', JSON.stringify(agg, null, 2));

    const results = await collection.aggregate(agg).toArray();

    // Send back results to the frontend
    res.json({ questions: results });
  } catch (error) {
    console.error('Error during search:', error.message);
    res.status(500).json({ error: 'Error fetching search results' });
  }
});


