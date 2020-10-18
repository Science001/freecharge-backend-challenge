const express = require("express");
const account = express.Router();
const bodyParser = require('body-parser');
const multer = require('multer');
const csv = require('fast-csv');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../mongoSingleton');
const authenticateJWT = require('../helpers/authenticateJWT');
const { getFileName } = require('../helpers/fileUploadHelper');

account.use(bodyParser.json());

// User can access this endpoint only if ther are logged in
account.use(authenticateJWT);

// Multer File Upload setup

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = `./userData`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, getFileName(file.originalname, req))
    }
});

const uploadFileMiddleware = (req, res, next) => {
    const upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
            // Restrict file upload to only CSV files
            var ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
            if (ext !== 'csv') {
                return cb(new Error('Only CSV files can be uploaded'));
            }
            cb(null, true)
        }
    }).single('file');

    upload(req, res, err => {
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        else next();
    });
}

// Actual APIs

account.get('/', async (req, res) => {

    // Connect to Database
    const db = await getDb().catch(_ => {
        res.status(500).send({ error: "Error connecting to database" });
    });
    const userCollection = db.collection('users');

    const user = await userCollection.findOne({ username: req.user.username });
    const { username, name, accountNumber, transactions } = user;
    res.send({ username, name, accountNumber, transactions });
});

account.post('/', uploadFileMiddleware, async (req, res, next) => {
    // Parse CSV and populate request
    let accountDetails = [];
    fs.createReadStream(`./userData/${req.file.filename}`)
        .pipe(csv.parse({ headers: true }))
        .on('data', row => {
            if (row["Date"]) {
                const type = row["Withdraw"] ? 'debit' : 'credit';
                accountDetails.push({
                    date: new Date(row["Date"]),
                    type,
                    amount: type === 'debit' ? parseInt(row["Withdraw"]) : parseInt(row["Deposit"]),
                    description: row["Description"],
                    balance: row["Closing Balance"],
                });
            }
        })
        .on('end', () => {
            req.accountDetails = accountDetails;
            next();
        });
}, async (req, res) => {
    const accountDetails = req.accountDetails;
    const { accountNumber, username } = req.user;
    // Connect to Database
    const db = await getDb().catch(_ => {
        res.status(500).send({ error: "Error connecting to database" });
    });
    const userCollection = db.collection('users');

    userCollection
        .updateOne(
            { accountNumber },
            { $set: { transactions: accountDetails } }
        )
        .then(() => {
            res.send({ username, accountNumber, transactions: accountDetails });
        })
        .catch(err => {
            console.log("Error updating user transactions to MongoDB", err);
            res.status(500).send("Error uploading your transactions");
        });
});

module.exports = account;