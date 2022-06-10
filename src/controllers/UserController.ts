import { UserModel, authenticate, User } from "../models/User";
import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { handleJWSTokenError } from "../helpers/auth-helpers/AuthenticateToken";
import { responseObject } from "../models/Response";
import { ErrorCode } from "../helpers/ErrorCode";
// import { process } from "../helpers/auth-helpers/AuthenticateToken";

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
        user.save();

        return res.json(user);
      } else {
        return res.json("Username is taken");
      }
    } catch (err) {
      return res.json({
        message: "Error when creating user",
        error: err,
      });
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
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        jwsToken: jwsToken,
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
   * Adds word to the current user as favorite word in the database.
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
                email: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                jwsToken: token,
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
