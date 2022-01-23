import express from 'express';
import IndexController from '../controllers/IndexController.js';

const router = express.Router();

/* GET home page. */
router.get('/', IndexController.showHomePage);

export default router;
