import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/UserController";
import { json } from "body-parser";

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

UserRouter.get(Route.user, json(), methodFromRoute);
UserRouter.post(Route.register, json(), methodFromRoute);
UserRouter.post(Route.login, json(), methodFromRoute);

export default UserRouter;
