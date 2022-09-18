import { UserModel, User } from "../models/User";
import { Request, Response } from "express";
import { responseObject } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";
import { UserService } from "../service/UserService";
import { isString } from "../shared/SharedHelpers";
import { isTokenNotValidResponse } from "../service/TokenValidator";

export namespace UserController {
  export async function create(req: Request, res: Response) {
    try {
      const isTaken = await UserService.isUsernameTaken(
        req.body.username as string
      );
      if (!isTaken) {
        const user = await UserService.save(req.body);
        res.status(200).send(
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
        res.status(409).send(
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
          errorMessage: "Username or password are undefined.",
          errorCode: ErrorCode.undefinedData,
        })
      );
      return;
    }

    try {
      const data = await UserService.loginUser(
        req.body.username,
        req.body.password
      );

      if (!data) {
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
    } catch {
      res.status(500).send(
        responseObject({
          errorMessage: "Internal server error",
        })
      );
      return;
    }
  }

  /**
   * Removes auth token from user document in the database.
   *
   * @param req The request.
   * @param res The response.
   */
  export async function logout(req: Request, res: Response) {
    const token = req.headers["authorization"]?.split(" ")[1];
    const tokenResponse = isTokenNotValidResponse(token);

    if (tokenResponse) {
      res.status(tokenResponse.statusCode).send(tokenResponse.response);
      return;
    }
    try {
      const updateErrorCode = await UserService.logoutUser(token!);
      const isError = updateErrorCode !== null;
      res.status(isError ? 400 : 200).send(
        responseObject({
          data: isError ? false : true,
          errorMessage: isError ? "Error while removing token." : null,
          errorCode: isError ? updateErrorCode : null,
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
    const token = req.headers["authorization"]?.split(" ")[1];
    const tokenResponse = isTokenNotValidResponse(token);
    if (tokenResponse) {
      res.status(tokenResponse.statusCode).send(tokenResponse.response);
      return;
    }

    try {
      const userResponse = await UserService.userFromToken(token!);
      const data = userResponse.response.data;
      const body = {
        id: data._id,
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        jwsToken: token,
        favoriteWordIds: data.favoriteWordIds,
      };
      userResponse.response.data = body;

      res.status(userResponse.statusCode).send(userResponse.response);
    } catch (e) {
      res.status(500).send(
        responseObject({
          errorMessage: "Internal server error",
          data: false,
        })
      );
    }
  }
}
