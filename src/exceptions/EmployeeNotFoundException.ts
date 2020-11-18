import HttpException from './HttpException';

class EmployeeNotFoundException extends HttpException {
  constructor(id: string) {
    super(404, `Employee with id ${id} not found`);
  }
}

export default EmployeeNotFoundException;
