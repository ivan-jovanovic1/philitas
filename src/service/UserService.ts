import { User, UserModel, authenticate } from "../models/User";
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

    user.jwsToken = await createJWSToken(requestBody.username as string);
    await user.save();
    return user as User;
  }

  export async function logUser(username: string, password: string) {
    try {
      const user = await authenticate(username, password);
      const jwsToken = await createJWSToken(username);
      await UserModel.updateOne({ username: username }, { jwsToken: jwsToken });
      return { user, jwsToken };
    } catch {
      return null;
    }
  }

  async function createJWSToken(username: string) {
    return sign(
      { username: username }, // provided username
      process.env.JWS_TOKEN_SECRET, // secret key
      { expiresIn: "7d" } // options
    );
  }
}
