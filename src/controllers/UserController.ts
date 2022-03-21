import { UserModel, authenticate } from "../models/User";
import { NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";
// import { process } from "../helpers/auth-helpers/AuthenticateToken";

export namespace UserController {
  export async function list(req: Request, res: Response) {
    try {
      const users = await UserModel.find();
      return res.json(users);
    } catch (err) {
      return res.status(500).json({
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

        return res.status(201).json(user);
      } else {
        return res.json("Username is taken");
      }
    } catch (err) {
      return res.status(500).json({
        message: "Error when creating user",
        error: err,
      });
    }
  }

  export async function login(req: Request, res: Response, next: NextFunction) {
    try {
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
      res.status(200).json(jsonBody);
    } catch (e) {
      console.error(e);
      res.status(500).json(new Error("Internal server error"));
    }
  }

  export async function logout(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.session) {
      try {
        // await req.session.destroy();
        return res
          .status(200)
          .render("naive-response", { text: "Uspesno ste se odjavili" });
      } catch (err) {
        return res.status(500).json(err);
      }
    }
  }
}

export default UserController;
