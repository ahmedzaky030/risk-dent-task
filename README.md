Risk Dent Task
========================

This is a simple Node.js + Express application written in Typescript 
that can be built and run on Heroku.

Also, this application depends on neo4j Graph database , you can work with it locally(needs changes connection in config.ts file) or use it as default with cloud database Neo4j Aura (default now up to evaluation)

[Live Demo link](https://risk-dent.herokuapp.com/) deployed on heroku 

navigate to /test  route, it must return TEST Ok  <br/>
navigate to /transactions?transactionId={id}&confidence={confidence}  

## Use
To use this application 

1. clone the repository
```
git clone <the repository link>
```
2. Install the dependencies
```
cd risk-dent-task
npm install
```
3. Run the application
```
npm run start
```


## Deploy
To deploy this application simply create a new Heroku app

```
heroku create
```

and then just push the sources to Heroku

```
git push heroku master
```

Heroku will download all necessary libraries and fire the web
process defined in [Procfile](Procfile) that will build and start
the application.

## How this works

Typically you will add typescript as a devDependency to your package.json.
But this won't work on Heroku since those dependencies are not downloaded
(due to `NODE_ENV` being set to `production`).

In order to go around this issue you just simply need to add typescript
as a regular dependency and build the project after each push.
