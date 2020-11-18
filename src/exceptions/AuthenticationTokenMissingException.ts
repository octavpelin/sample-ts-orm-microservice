import HttpException from './HttpException';

class AuthenticationTokenMissingException extends HttpException {
  constructor() {
    super(401, 'Authentication Token Missing');
  }
}

export default AuthenticationTokenMissingException;
