import * as express from 'express';
import { getRepository } from 'typeorm';
import Controller from '../interfaces/controller.interface';
import Post from './post.entity';
import PostNotFoundException from '../exceptions/PostNotFoundException';
import validationMiddleware from '../middleware/validation.middleware';
import authMiddleware from '../middleware/auth.middleware';
import CreatePostDto from './post.dto';
import RequestWithUser from '../interfaces/requestWithUser.interface';

class PostsController implements Controller {
    public path = '/posts';
    public router = express.Router();
    private postRepository = getRepository(Post);

    constructor() {
        this.initializeRoutes();
    }

    public initializeRoutes() {
        this.router.get(this.path, this.getAllPosts);
        this.router.get(`${this.path}/:id`, this.getPostById);
        this.router
            .all(`${this.path}/*`, authMiddleware())
            .post(this.path, validationMiddleware(CreatePostDto), this.createAPost)
            .patch(`${this.path}/:id`, validationMiddleware(CreatePostDto, true), this.modifyPostById)
            .delete(`${this.path}/:id`, this.deletePost);
    }

    private getAllPosts = async (req: express.Request, res: express.Response) => {
        const posts = await this.postRepository.find({relations: ['categories'], loadRelationIds: {relations: ['author']}});
        res.status(200).send(posts);
    }

    private getPostById = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const id = req.params.id;
        const post = await this.postRepository.findOne(id, { relations: ['categories'], loadRelationIds: {relations: ['author']}});
        
        if(post) {
            res.status(200).send(post);
        } else {
            next(new PostNotFoundException(id));
        }
    }

    modifyPostById = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const id = req.params.id;
        const post: Post = req.body;
        await this.postRepository.update(id, post);
        const updatedPost = await this.postRepository.findOne(id);
        if(updatedPost) {
            res.status(200).send(updatedPost);
        } else {
            next(new PostNotFoundException(id));
        }
    }

    deletePost = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const id = req.params.id;

        // update post-side
        const successResponse = await this.postRepository.delete(id);
        if(successResponse.raw[1]) {
            res.sendStatus(200);
        } else {
            next(new PostNotFoundException(id));
        }
    }

    createAPost = async (req: RequestWithUser, res: express.Response) => {
        const post: CreatePostDto = req.body;

        // create a post with the model
        const createdPost = this.postRepository.create({
            ...post,
            author: req.user,
        });

        // update post-side
        await this.postRepository.save(createdPost);
        
        createdPost.author = undefined;
        // send response
        res.status(201).send(createdPost);
    }

}

export default PostsController;