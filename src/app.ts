import * as cookieParser from 'cookie-parser';
import * as express from 'express';
// import * as sqlite3 from 'sqlite3';
import * as mongoose from 'mongoose';
import * as bodyparser from 'body-parser';

import Controller from './interfaces/controller.interface';
import errorMiddleware from './middleware/error.middleware';

class App {
  public app: express.Application;

  constructor(controllers: Controller[]) {
    this.app = express();

    this.connectToTheDatabase();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  public getServer() {
    return this.app;
  }

  private loggerMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log(`${req.method} ${req.path}`);
    next();
  }

  private initializeMiddlewares() {
        // log all the requests
    this.app.use(this.loggerMiddleware);

        // parse cookies
    this.app.use(cookieParser());

        // parse application/x-www-form-urlencoded
    this.app.use(bodyparser.urlencoded({ extended: false }));

        // parse application/json
    this.app.use(bodyparser.json());
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  }

  private connectToTheDatabase() {
        // this.connectToMongo();
  }

  private connectToMongo() {
    const {
            MONGO_USER,
            MONGO_PASSWORD,
            MONGO_PATH,
        } = process.env;
    mongoose.connect(`mongodb://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}`);
  }

  public listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App is listening on the port ${process.env.PORT}`);
    });
  }
}

export default App;
