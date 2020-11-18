import {
    cleanEnv, str, port,
} from 'envalid';

function validateEnv() {
  cleanEnv(process.env, {
    JWT_SECRET: str(),
    TWO_FACTOR_AUTHENTICATION_APP_NAME: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_HOST: str(),
    POSTGRES_USER: str(),
    POSTGRES_PORT: port(),
    POSTGRES_DB: str(),
    PORT: port(),
  });
}

export default validateEnv;
