import 'dotenv/config';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import App from './app';
import config from './ormconfig';
import PostsController from './posts/posts.controller';
import CategoryController from './category/category.controller';
import AuthenticationController from './authentication/authentication.controller';
import AddressController from './address/address.controller';
import validateEnv from './utils/validateEnv';

validateEnv();
(async() => {
  try {
    const conn =  await createConnection(config);
    await conn.runMigrations();
  } catch (error) {
    console.log('Error while connecting to the database', error);
    return error;
  }
  const app = new App(
    [
      new AuthenticationController(),
      new PostsController(),
      new CategoryController(),
      new AddressController(),
    ],
    );

  app.listen();
})();
