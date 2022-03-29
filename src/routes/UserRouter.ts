import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/UserController";
import { json } from "body-parser";
import { authenticateToken } from "../helpers/auth-helpers/AuthenticateToken";

const UserRouter = Router();

namespace Route {
  export const register = "/register";
  export const user = "/me";
  export const login = "/login";
}

async function methodFromRoute(req: Request, res: Response) {
  if (req.route.path === Route.login) {
    UserController.login(req, res);
    return;
  }

  if (req.route.path === Route.register) {
    UserController.create(req, res);
    return;
  }

  if (req.route.path === Route.user) {
    UserController.userFromToken(req, res);
    return;
  }

  res.status(404).send({ errorMessage: "Page not found" });
}

/* GET home page. */
UserRouter.get("/", (req: Request, res: Response) => {
  res.json({
    title: "My express app",
    description: "Hello world",
  });
});

UserRouter.get(Route.user, json(), methodFromRoute);
UserRouter.post(Route.register, json(), methodFromRoute);
UserRouter.post(Route.login, json(), methodFromRoute);

export default UserRouter;
