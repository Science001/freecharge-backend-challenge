const express = require("express");
const auth = express.Router();
const crypto = require('crypto');
const { customAlphabet } = require('nanoid');
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
const { getDb } = require('../mongoSingleton');

auth.use(bodyParser.json());
const generateAccountNumber = customAlphabet('1234567890', 8);
function hash(input, salt) {
    var hashed = crypto.pbkdf2Sync(input, salt, 10000, 512, 'sha512');
    return ["pdkdf2", "10000", salt, hashed.toString('hex')].join('$');
}

auth.post('/register', (req, res, next) => {
    // Verify if we have all the data
    const { username, name, password } = req.body;
    if (!(username && name && password))
        res.status(400).send({ error: "The request body is incomplete" });
    else next();
}, async (req, res) => {
    const { username, name, password } = req.body;

    // Hash the password
    const salt = crypto.randomBytes(128).toString('hex');
    const hashedPassword = hash(password, salt);

    // Create an account number
    const accountNumber = generateAccountNumber();

    // Connect to Database
    const db = await getDb().catch(_ => {
        res.status(500).send({ error: "Error connecting to database" });
    });
    const userCollection = db.collection('users');

    // Check for duplicates
    const prevUser = await userCollection.findOne({ $or: [{ username }, { accountNumber }] });
    if (prevUser) {
        if (prevUser.username === username) {
            // The username is taken
            res.status(400).send({ error: "This username is already taken" });
        }
        else if (prevUser.accountNumber === accountNumber) {
            // We created a non-unique account number
            // While we can iteratively try to create an unique account number, it is a  huge overhead
            // We currently resort to having the user retry
            res.status(500).send({ error: "Couldn't create an account number. Please try again." })
        }
    }
    else {
        // Yayy, Store to Database
        const userDocument = { username, name, password: hashedPassword, accountNumber };
        await userCollection.insertOne(userDocument);
        res.send({ username, name, accountNumber });
    }
});

auth.post('/login', (req, res, next) => {
    const { username, password } = req.body;
    if (!(username && password))
        res.status(400).send({ error: "The request body is incomplete" });
    else next();
}, async (req, res) => {
    const { username, password } = req.body;

    // Connect to Database
    const db = await getDb().catch(_ => {
        res.status(500).send({ error: "Error connecting to database" });
    });
    const userCollection = db.collection('users');

    // Find the user
    const user = await userCollection.findOne({ username });
    if (user) {
        const { password: actualHashed, username, accountNumber, name, transactions } = user;
        const salt = actualHashed.split('$')[2];
        const givenHashed = hash(password, salt);
        if (actualHashed === givenHashed) {
            // That's the right password
            const accessToken = jwt.sign({ username, accountNumber }, process.env.JWT_SECRET);
            const responseObject = { username, name, accountNumber, accessToken, transactions };
            res.send(responseObject);
        }
        else {
            // Incorrect password
            res.status(400).send({ error: "Username / Password is invalid" })
        }
    }
    else {
        // They haven't registered yet
        res.status(400).send({ error: "Username / Password is invalid" })
    }
});

module.exports = auth;