const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(morgan('dev'));
app.use(bodyParser.json());

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
    res.send('Welcome to grk\'s UPI 2.0');
});

app.use('/auth', require('./routers/auth.route'));
app.use('/account', require('./routers/account.route'));

app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`);
});