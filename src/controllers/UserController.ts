import { UserModel, authenticate } from "../models/User";
import { NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";

declare var process: {
  env: {
    JWS_TOKEN_SECRET: string;
  };
};

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

  export async function show(req: Request, res: Response) {
    const id = req.params.id;
    try {
      const user = await UserModel.findOne({ _id: id });
      if (!user) {
        return res.status(404).json({
          message: "No such user",
        });
      } else {
        return res.json(user);
      }
    } catch (err) {
      return res.status(500).json(err);
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

  export async function deleteUser(req: Request, res: Response) {
    try {
      await UserModel.findByIdAndRemove(req.params.id);
      res.json("Uspešno izbrisan uporabnik.");
    } catch (err) {
      return res.status(500).json({
        message: "Error when deleting user",
        error: err,
      });
    }
  }

  export async function login(req: Request, res: Response, next: NextFunction) {
    console.log(`Ivan, geslo ${req.body.password}`);
    authenticate(req.body.username, req.body.password)
      .then((user) => {
        // Create JWSToken
        const jwsToken = sign(
          { username: user.username }, // provided username
          process.env.JWS_TOKEN_SECRET, // secret key
          { expiresIn: "7d" } // options
        );

        // Insert JWSToken in database so app can use it in the user authentication process
        UserModel.updateOne(
          { username: req.body.username },
          { authToken: jwsToken }
        )
          .then((result) => {
            const jsonBody = {
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              jwsToken: jwsToken,
            };

            return res.status(200).json(jsonBody);
          })
          .catch((error) => {
            return res.status(500).json(new Error("Internal server error"));
          });
      })
      .catch((failure) => {
        console.log(failure);
        return res.status(401).json(failure);
      });
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

  // export async function showLogin(req, res) {
  //     res.render('user/login');
  // }

  // static showRegister(req, res) {
  //     res.render('user/register');
  // }
}

export default UserController;
