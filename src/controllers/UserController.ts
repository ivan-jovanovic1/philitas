import { UserModel, authenticate, User } from "../models/User";
import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { handleJWSTokenError } from "../service/AuthTokenService";
import { responseObject } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";

export namespace UserController {
  export async function list(req: Request, res: Response) {
    try {
      const users = await UserModel.find();
      return res.json(users);
    } catch (err) {
      return res.json({
        message: "Error when getting list of all users.",
        error: err,
      });
    }
  }

  export async function create(req: Request, res: Response) {
    const user = new UserModel({
      email: req.body.email,
      firstName: req.body.firstname,
      lastName: req.body.lastname,
      phoneNumber: req.body.phonenumber,
      username: req.body.username,
      password: req.body.password,
    });
    try {
      let takenUsername = await UserModel.findOne({
        username: req.body.username,
      });
      if (!takenUsername) {
        console.log("saving user");
        const jwsToken = sign(
          { username: user.username }, // provided username
          process.env.JWS_TOKEN_SECRET, // secret key
          { expiresIn: "7d" } // options
        );
        user.authToken = jwsToken;
        user.save();

        const userData = user as User;

        await UserModel.updateOne(
          { username: user.username },
          { authToken: jwsToken }
        );

        return res.status(200).send(
          responseObject({
            data: {
              id: userData._id,
              username: userData.username,
              email: userData.email,
              jwsToken: userData.authToken,
              firstName: user.firstName,
              lastName: user.lastName,
              favoriteWordIds: user.favoriteWordIds,
            },
          })
        );
        return res.json(user);
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
        })
      );
    }
  }

  export async function login(req: Request, res: Response) {
    try {
      if (
        (req.body.username === null || req.body.username === undefined,
        req.body.password === null || req.body.password === undefined)
      ) {
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

      const user = await authenticate(req.body.username, req.body.password);
      const jwsToken = sign(
        { username: user.username }, // provided username
        process.env.JWS_TOKEN_SECRET, // secret key
        { expiresIn: "7d" } // options
      );

      await UserModel.updateOne(
        { username: req.body.username },
        { authToken: jwsToken }
      );

      const jsonBody = {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        authToken: jwsToken,
        favoriteWordIds: user.favoriteWordIds,
      };
      res.status(200).send(responseObject({ data: jsonBody }));
    } catch (e) {
      console.error(e);
      res.status(500).send(
        responseObject({
          errorMessage: "Internal server error",
        })
      );
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

    try {
      const user = (await UserModel.findOne({ authToken: token })) as User;
      await UserModel.updateOne({ _id: user._id }, { authToken: undefined });
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
      UserModel.findOne({ authToken: token })
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
                authToken: token,
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
