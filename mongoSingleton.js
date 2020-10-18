const { MongoClient, Db } = require("mongodb");

/**
 * @type {MongoClient}
 */
let client = null;

/**
 * Returns a singleton db connection
 * @returns {Promise<Db>}
 */
const connectDb = async () => {
    return new Promise((resolve, reject) => {
        client = new MongoClient(process.env.MONGODB_URL, {
            useUnifiedTopology: true,
        });
        client.connect()
            .then(() => {
                console.log("Connected to MongoDB");
                const db = client.db("upi");
                resolve(db);
            })
            .catch(err => {
                console.log("MongoDB connection failed", err);
                reject(err);
            });
    })
}

/**
 * Returns a singleton db connection
 * @returns {Promise<Db>}
 */
const getDb = async () => {
    if (client)
        return new Promise((resolve, _reject) => {
            const db = client.db('upi');
            resolve(db);
        });
    else {
        return connectDb();
    }
}

const closeDb = () => {
    if (client) {
        client.close();
        console.log("MongoDB connection closed");
    }
};

module.exports = { getDb, closeDb }