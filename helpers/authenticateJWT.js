const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        // Get the Bearer token from the auth header
        const accessToken = authHeader.split(' ')[1];

        jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                // Invalid JWT
                return res.status(403).send({ error: "Invalid access token recieved" });
            }
            req.user = user;
            next();
        });
    } else {
        // No JWT
        return res.status(401).send({ error: "You have to be logged in first" });
    }
};

module.exports = authenticateJWT;