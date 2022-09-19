import { Request, Response, NextFunction } from "express";
import { verify, VerifyErrors } from "jsonwebtoken";
import { responseObject } from "../models/BaseResponse";
import { UserModel } from "../models/User";
import { ErrorCode } from "../models/ErrorCode";

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
    return res.json({ errorMessage: "Token does not exist.", data: false });

  // Verify JSONWebToken
  verify(token, process.env.JWS_TOKEN_SECRET as string, (err, user) => {
    // TODO: Add logic to remove token from DB so it can't be used if it already has expired

    handleJWSTokenError(err, token, res);
    // Check token with the one in DB
    UserModel.findOne({ jwsToken: token })
      .then((userDB) => {
        return userDB !== null && user !== undefined
          ? next()
          : res.json({ errorMessage: "Unauthorized", data: false });
      })
      .catch((error) => {
        return res.json({
          errorMessage: "Error while checking token",
          data: false,
        });
      });

    // return res.json({ errorMessage: "Unknown error", data: false });
  });
  // return res.json(new Error("Unauthorized"));
};

const handleJWSTokenError = (
  err: VerifyErrors | null,
  token: string,
  res: Response
) => {
  if (err !== null) {
    UserModel.updateOne(
      { jwsToken: token },
      { jwsToken: "" },
      { upsert: false }
    )
      .then((updated) => {
        res.status(403).send(
          responseObject({
            errorMessage: "Token expired.",
            errorCode: ErrorCode.expiredData,
          })
        );
      })
      .catch((error) => {
        res
          .status(400)
          .send(responseObject({ errorMessage: "Internal server error" }));
      });
  }
};

export { authenticateToken, handleJWSTokenError };
