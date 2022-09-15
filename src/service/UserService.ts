import { User, UserModel } from "../models/User";
import { sign } from "jsonwebtoken";

export namespace UserService {
  export async function isUsernameTaken(username: string) {
    const user = await UserModel.findOne({
      username: username,
    });
    return user !== null;
  }

  export async function save(requestBody: any) {
    const user = new UserModel({
      email: requestBody.email,
      firstName: requestBody.firstname,
      lastName: requestBody.lastname,
      phoneNumber: requestBody.phonenumber,
      username: requestBody.username,
      password: requestBody.password,
    });

    user.authToken = await createJWSToken(requestBody.username as string);
    await user.save();
    return user as User;
  }

  async function createJWSToken(username: string) {
    return sign(
      { username: username }, // provided username
      process.env.JWS_TOKEN_SECRET, // secret key
      { expiresIn: "7d" } // options
    );
  }
}
