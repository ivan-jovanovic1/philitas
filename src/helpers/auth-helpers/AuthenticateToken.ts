import { Router, Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { UserModel } from "../../models/User";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWS_TOKEN_SECRET: string;
    }
  }
}

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Remove "Bearer" prefix as we need only token value
  const token = req.headers["authorization"]?.split(" ")[1];

  // Check if token is null or undefined
  if (token === null || token === undefined)
    return res.json(new Error("Token does not exist."));

  // Verify JSONWebToken
  verify(token, process.env.JWS_TOKEN_SECRET as string, (err, user) => {
    // TODO: Add logic to remove token from DB so it can't be used if it already has expired
    if (err) return res.json(new Error(err.message));

    // Check token with the one in DB
    UserModel.findOne({ authToken: token })
      .then((user) => {
        return user !== null && user !== undefined
          ? next()
          : res.json(new Error("Unauthorized"));
      })
      .catch((error) => {
        return res.json(new Error("Internal server error"));
      });
    return res.json(new Error("Unauthorized"));
  });

  return res.json(new Error("Unauthorized"));
};

export { authenticateToken };
