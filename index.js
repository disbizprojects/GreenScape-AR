require('dotenv').config();      // load .env
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI; // read the Mongo URI
const client = new MongoClient(uri);