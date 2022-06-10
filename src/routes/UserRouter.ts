import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/UserController";
import { json } from "body-parser";

const UserRouter = Router();
namespace Route {
  export const register = "/register";
  export const user = "/me";
  export const login = "/login";
  export const logout = "/logout";
}

async function methodFromRoute(req: Request, res: Response) {
  if (req.route.path === Route.login) {
    return UserController.login(req, res);
  }

  if (req.route.path === Route.logout) {
    return UserController.logout(req, res);
  }

  if (req.route.path === Route.register) {
    return UserController.create(req, res);
  }

  if (req.route.path === Route.user) {
    return UserController.userFromToken(req, res);
  }

  res.status(404).send({ errorMessage: "Page not found" });
}

UserRouter.get(Route.user, json(), methodFromRoute);
UserRouter.post(Route.register, json(), methodFromRoute);
UserRouter.post(Route.login, json(), methodFromRoute);
UserRouter.post(Route.logout, json(), methodFromRoute);

export default UserRouter;
