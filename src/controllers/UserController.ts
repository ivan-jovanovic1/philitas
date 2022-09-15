import { UserModel, authenticate, User } from "../models/User";
import { Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { handleJWSTokenError } from "../service/AuthTokenService";
import { responseObject } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";
import { UserService } from "../service/UserService";
import { isString } from "../shared/SharedHelpers";

export namespace UserController {
  export async function create(req: Request, res: Response) {
    try {
      const isTaken = await UserService.isUsernameTaken(
        req.body.username as string
      );
      if (!isTaken) {
        const user = await UserService.save(req.body);

        return res.status(200).send(
          responseObject({
            data: {
              id: user._id,
              username: user.username,
              email: user.email,
              jwsToken: user.jwsToken,
              firstName: user.firstName,
              lastName: user.lastName,
              favoriteWordIds: user.favoriteWordIds,
            },
          })
        );
      } else {
        return res.status(409).send(
          responseObject({
            errorMessage: "Username is taken",
            errorCode: ErrorCode.takenUsername,
          })
        );
      }
    } catch (err) {
      return res.status(500).send(
        responseObject({
          errorMessage: "Interal server error.",
          errorCode: 500,
        })
      );
    }
  }

  export async function login(req: Request, res: Response) {
    if (!isString(req.body.username) || !isString(req.body.password)) {
      res.status(400).send(
        responseObject({
          data: null,
          pagination: null,
          errorMessage: "Username or password are undefined.",
          errorCode: ErrorCode.undefinedData,
        })
      );
      return;
    }

    const data = await UserService.logUser(
      req.body.username,
      req.body.password
    );

    if (data === null) {
      res.status(500).send(
        responseObject({
          errorMessage: "Internal server error",
        })
      );
      return;
    }
    const jsonBody = {
      id: data.user._id,
      username: data.user.username,
      email: data.user.email,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      jwsToken: data.jwsToken,
      favoriteWordIds: data.user.favoriteWordIds,
    };
    res.status(200).send(responseObject({ data: jsonBody }));
  }

  /**
   * Removes auth token from user document in the database.
   *
   * @param req The request.
   * @param res The response.
   */
  export async function logout(req: Request, res: Response) {
    const token = req.headers["authorization"]?.split(" ")[1];

    try {
      const user = (await UserModel.findOne({ jwsToken: token })) as User;
      await UserModel.updateOne({ _id: user._id }, { jwsToken: undefined });
      res.status(200).send(
        responseObject({
          data: true,
        })
      );
    } catch {
      res.status(500).send(
        responseObject({
          errorMessage: "Internal server error",
          data: false,
        })
      );
    }
  }

  export async function userFromToken(req: Request, res: Response) {
    // Remove "Bearer" prefix as we need only token value
    const token = req.headers["authorization"]?.split(" ")[1];

    // Check if token is null or undefined
    if (token === null || token === undefined) {
      res.status(400).send(
        responseObject({
          data: null,
          errorCode: ErrorCode.undefinedData,
          errorMessage: "Token has no valid value.",
        })
      );
      return;
    }
    // Verify JSONWebToken
    verify(token, process.env.JWS_TOKEN_SECRET as string, (err, callback) => {
      handleJWSTokenError(err, token, res);
      // Check token with the one in DB
      UserModel.findOne({ jwsToken: token })
        .then((userDB) => {
          const user = userDB as User;

          return res.json(
            responseObject({
              data: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                jwsToken: token,
                favoriteWordIds: user.favoriteWordIds,
              },
            })
          );
        })
        .catch((error) => {
          return res.json(
            responseObject({
              errorMessage: "Error while checking token",
              data: null,
            })
          );
        });
    });
  }
}
