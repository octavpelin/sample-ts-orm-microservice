import * as express from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { getRepository } from 'typeorm';
import CategoryNotFoundException from '../exceptions/CategoryNotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateCategoryDto from './category.dto';
import Category from './category.entity';

class CategoryController implements Controller {
    public path = '/categories';
    public router = express.Router();
    private categoryRepository = getRepository(Category);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.getAllCategories);
        this.router.get(`${this.path}/:id`, this.getCategoryById);
        this.router.post(this.path, authMiddleware(), validationMiddleware(CreateCategoryDto), this.createCategory);
    }

    private getAllCategories = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const categories = await this.categoryRepository.find({relations: ['posts']});
        res.send(categories);
    }

    private getCategoryById = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const id = req.params.id;

        const category = await this.categoryRepository.findOne(id, { relations: ['posts']})
        if(category) {
            res.send(category);
        } else {
            next(new CategoryNotFoundException(id));
        }
    }

    private createCategory = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const categoryData: CreateCategoryDto = req.body;
        const newCategory = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(newCategory);
        res.send(newCategory);
    }
}

export default CategoryController;