## QuackSnap

QuackSnap is a school project for the Development Environment course. It is a small website where you take a picture of your duck and show it off (a brag about your duck).

### Origin

This project is forked from a previous API project called RubberDucks:
https://github.com/HelenaKjeld/RubberDucks

### Start the server

```
npm run start-dev
```

On startup, the app runs a connect + ping + disconnect to verify the DB connection.

### Swagger documentation

After the server starts, open:

http://localhost:4000/api/docs


### Rendur backend

Build Command
Render runs this command to build your app before each deploy.

```
npm install && npm run build
```

Start Command
Render runs this command to start your app with each deploy.

```
node dist/src/index.js
```

Health Check Path
Provide an HTTP endpoint path that Render messages periodically to monitor your service. 

/api/

### Rendur frontend

Build Command
Render runs this command to build your app before each deploy.

```
npm install && npm run build
```

Start Command
Render runs this command to start your app with each deploy.

```
dist
```

Health Check Path
Provide an HTTP endpoint path that Render messages periodically to monitor your service. 

/api/
