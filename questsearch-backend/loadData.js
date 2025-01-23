const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas configuration
const mongoURI = process.env.MONGO_URI;
const dbName = "questsearch";
const collectionName = "questions";

// Read the JSON data
const rawData = fs.readFileSync('./data/speakx_questions.json');
const questions = JSON.parse(rawData);

// Connect to MongoDB Atlas
async function connectToMongoDB() {
    const client = new MongoClient(mongoURI);
    try {
        console.log("Attempting to connect to MongoDB Atlas...");
        await client.connect();
        console.log("Connected to MongoDB Atlas");
        return client;
    } catch (err) {
        console.error("Failed to connect to MongoDB Atlas", err);
    }
}

// Function to recursively handle $oid fields and convert them to ObjectId
function handleOids(obj) {
    for (const key in obj) {
        if (obj[key] && obj[key].$oid) {
            obj[key] = ObjectId.createFromHexString(obj[key].$oid);
        } else if (typeof obj[key] === 'object') {
            handleOids(obj[key]);
        }
    }
}

// Insert the questions into MongoDB Atlas using bulk write
async function insertQuestions() {
    const client = await connectToMongoDB();
    if (!client) {
        console.error("Unable to connect to MongoDB. Exiting...");
        return;
    }

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    try {
        const processedQuestions = questions.map((question) => {
            handleOids(question);
            return question;
        });

        // Bulk insert in batches of 5k
        const BATCH_SIZE = 5000;
        let batch = [];
        let failedInserts = [];

        for (let i = 0; i < processedQuestions.length; i++) {
            batch.push(processedQuestions[i]);

            // When the batch reaches the desired size, insert it
            if (batch.length === BATCH_SIZE || i === processedQuestions.length - 1) {
                try {
                    const result = await collection.bulkWrite(
                        batch.map(doc => ({
                            insertOne: { document: doc }
                        }))
                    );
                    console.log(`Inserted ${result.insertedCount} documents successfully`);
                } catch (err) {
                    failedInserts.push(...batch);
                    console.error("Failed to insert batch:", err);
                }
                batch = []; // Reset batch
            }
        }

        console.log(`All documents processed. Failed insertions (if any): ${failedInserts.length}`);

        if (failedInserts.length > 0) {
            console.log("Retrying failed insertions...");
            // Retry logic for failed documents
            await retryFailedInserts(failedInserts);
        }

    } catch (err) {
        console.error("Error inserting data:", err);
    } finally {
        await client.close();
    }
}

// Retrying failed inserts
async function retryFailedInserts(failedDocs) {
    const client = await connectToMongoDB();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    try {
        const result = await collection.bulkWrite(
            failedDocs.map(doc => ({
                insertOne: { document: doc }
            }))
        );
        console.log(`Retried and inserted ${result.insertedCount} failed documents.`);
    } catch (err) {
        console.error("Error retrying failed insertions:", err);
    } finally {
        await client.close();
    }
}

insertQuestions();
