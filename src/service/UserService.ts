import { User, UserModel, authenticate } from "../models/User";
import { sign } from "jsonwebtoken";
import { verify, VerifyErrors } from "jsonwebtoken";
import { responseObject, ResponseWithStatus } from "../models/BaseResponse";
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
    try {
      const user = await authenticate(username, password);
      const jwsToken = await createJWSToken(username);
      await UserModel.updateOne({ username: username }, { jwsToken: jwsToken });
      return { user, jwsToken };
    } catch {
      return null;
    }
  }

  export async function userFromToken(
    token: string
  ): Promise<ResponseWithStatus> {
    try {
      const isValid = await verifyJWSToken(token);
      if (!isValid) {
        await removeJWSTokenFromUser(token);
        return {
          statusCode: 403,
          response: {
            errorMessage: "Token expired.",
            errorCode: ErrorCode.expiredData,
          },
        };
      }
      const user = (await UserModel.findOne({ jwsToken: token })) as User;
      return { statusCode: 200, response: { data: user } };
    } catch {
      return {
        statusCode: 200,
        response: { errorMessage: "Internal serve error.", errorCode: 500 },
      };
    }
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
      process.env.JWS_TOKEN_SECRET, // secret key
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
