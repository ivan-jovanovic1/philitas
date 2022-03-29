import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/UserController";
import { json } from "body-parser";
import { authenticateToken } from "../helpers/auth-helpers/AuthenticateToken";

const UserRouter = Router();

const registerRoute = "/register";
const userRoute = "/me";
const loginRoute = "/login";
async function methodFromRoute(req: Request, res: Response) {
  if (req.route.path === loginRoute) {
    UserController.login(req, res);
    return;
  }

  if (req.route.path === registerRoute) {
    UserController.create(req, res);
    return;
  }

  if (req.route.path === userRoute) {
    UserController.userFromToken(req, res);
    return;
  }

  res.json({ errorMessage: "Invalid page" });
}

/* GET home page. */
UserRouter.get("/", (req: Request, res: Response) => {
  res.json({
    title: "My express app",
    description: "Hello world",
  });
});

UserRouter.get(userRoute, json(), methodFromRoute);
UserRouter.post(registerRoute, json(), methodFromRoute);
UserRouter.post(loginRoute, json(), methodFromRoute);

export default UserRouter;
