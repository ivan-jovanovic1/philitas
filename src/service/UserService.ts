import { User, UserModel, authenticate } from "../models/User";
import { sign } from "jsonwebtoken";
import { verify } from "jsonwebtoken";
import { ResponseWithStatus } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";

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

  export async function loginUser(username: string, password: string) {
    const user = await authenticate(username, password);
    const jwsToken = await createJWSToken(username);
    const result = await UserModel.updateOne(
      { username: username },
      { jwsToken: jwsToken }
    );

    return result.modifiedCount > 0 ? { user, jwsToken } : null;
  }
  export async function logoutUser(token: string) {
    const userDB = await UserModel.findOne({ jwsToken: token }); //as User
    if (!userDB) return ErrorCode.notFoundData;
    const user = userDB as User;
    const updated = await UserModel.updateOne(
      { _id: user._id },
      { jwsToken: "" }
    );

    return updated.modifiedCount > 0 ? null : ErrorCode.notUpdated;
  }

  export async function userFromToken(token: string): Promise<User | null> {
    const isValid = await verifyJWSToken(token);
    if (!isValid) {
      await removeJWSTokenFromUser(token);
      return null;
    }
    const userDB = await UserModel.findOne({ jwsToken: token });
    const user = userDB as User;
    return userDB !== null ? user : null;
    // r//eturn { statusCode: 200, response: { data: user } };
  }

  async function removeJWSTokenFromUser(token: string) {
    await UserModel.updateOne(
      { jwsToken: token },
      { jwsToken: "" },
      { upsert: false }
    );
  }

  async function createJWSToken(username: string) {
    return sign(
      { username: username }, // provided username
      process.env.JWS_TOKEN_SECRET!, // secret key
      { expiresIn: "7d" } // options
    );
  }

  export async function verifyJWSToken(token: string) {
    return new Promise(
      (resolve: (value: boolean) => void, reject: (value: Error) => void) => {
        verify(token!, process.env.JWS_TOKEN_SECRET as string, (err) => {
          if (err !== null) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      }
    );
  }
}
