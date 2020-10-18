# Freecharge Backend Challenge

This website was made as a part of the Freecharge Backend Challenge.

## How to view the project

After unzipping the folder, run `npm install` to install dependencies.

Setup env
- PORT=8000
- MONGODB_URL=<url_to_mongo_cluster>
- JWT_SECRET=<secret_string>

Once that is done, you can run `npm start` to view the project in your browser.

### Auth endpoints

POST /auth/register - To create user `{username, name, password}`

POST /auth/login - To login `{username, password}` - returns JWT token

### Set that token as bearer to use following endpoints
GET /account - To get account details

POST /account - Upload csv with key `file`