# Backend Repo for Inventures

This is the repository containing the backend source code of the Inventures project.

## Documentation

All the technical documentation is in the docs folder, with the README.md as the start point.

## Run Locally

This repository requires Docker to run. To install it, you can download the Docker Desktop program for Windows or Linux.

### Step 1: Setup .env file

In the root directory, create a `.env` file following the `.env.example` template, where each variable represents:

* `MONGODB_DB=my_db_name`
    - The name of your database
* `MONGODB_URL=mongodb://db:27017/my_db_name`
    - The URL to connect to your MongoDB instance
* `PORT=3000`
    - The port on which the application will run
* `API_KEY=your_api_key`
    - Your API key for authentication
* `CORS_ORIGIN=http://localhost:5173`
    - The origin allowed for CORS, is the url where your frontend runs. Multiple origins should be separated by a comma i.e. `http://localhost:5173,http://localhost:4173`


Note that API_KEY is shared between backend and frontend so both .env files should have the same api key.

### Step 2: Build and run

Once .env is set, the 2 containers must be built, in the root folder of the proyect execute (sudo may be needed):

```bash
docker compose build
```

Then to start running the containers, execute docker compose run with detached mode (optional) to free the console:

```bash
docker compose up -d
```

Now it's all set, the api should be running on port specified in .env file. You can check if the api is running making a GET at the api url.

To shut off, execute:
```bash
docker compose down
```