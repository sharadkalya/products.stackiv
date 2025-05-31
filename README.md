# stayinn

In progress
This project uses Docker for containerization. Follow the instructions below to set up and run the application locally.


---

## Prerequisites

Before you can run the application locally, make sure you have Docker installed on your system.

### To install Docker:

Click [here](https://docs.docker.com/get-docker/) to follow the installation guide for Docker based on your operating system.

## Running the Application Locally

### Full App Setup:

To start the entire application (all services), run the following command from the root of your project:

```bash
docker-compose up stayinn-app
```

This will build and run all necessary containers for the app.

### Running Specific Apps:

You can also choose to run specific services individually:

#### To run the Backend service:

```bash
docker-compose up backend
```

#### To run the Frontend (Host) application:

```bash
docker-compose up hosts
```

## Known Issues:

* The setup runs `yarn install` on every container during startup. This can take some time, depending on your internet connection and project dependencies.

