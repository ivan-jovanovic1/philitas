import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

// TODO: Check why isVerified doesn't work
/// User schema and its corresponding interface.
let userSchema = new Schema<User>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  //   isVerified: { type: Boolean, required: true },
  jwsToken: { type: String, required: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
});

class User {
  _id: string;
  username: string;
  password: string;
  email: string;
  isVerified: boolean;
  jwsToken?: string;
  firstName?: string;
  lastName?: string;

  constructor(
    username: string,
    password: string,
    email: string,
    firstName?: string,
    lastName?: string
  ) {
    this._id = uuid();
    this.username = username;
    this.password = password;
    this.email = email;
    this.isVerified = false;
    this.firstName = firstName;
    this.lastName = lastName;
  }
}

/// Authenticate credentials againts database.
const authenticate = (username: string, password: string) => {
  return new Promise(
    (
      resolve: (value: {
        _id: string;
        username: string;
        email: string;
        isVerified: boolean;
        firstName: string;
        lastName: string;
      }) => void,
      reject: (value: Error) => void
    ) => {
      UserModel.findOne({ username: username }).exec((err, user) => {
        if (err) {
          reject(err);
          return;
        } else if (!user || !user.password) {
          reject(new Error("User not found"));
          return;
        }

        bcrypt.compare(password, user!.password, (err, result) => {
          if (err) {
            reject(err);
          }
          if (result) {
            if (
              user?.password != undefined &&
              user?.username != undefined &&
              user?.email != undefined &&
              user?._id != undefined
            ) {
              resolve({
                _id: user._id,
                username: user!.username,
                email: user!.email,
                isVerified: user!.isVerified,
                firstName: user?.firstName !== undefined ? user?.firstName : "",
                lastName: user?.lastName !== undefined ? user?.lastName : "",
              });
            } else {
              reject(new Error("Internal server error."));
            }
          } else {
            return reject(new Error("Wrong credentials"));
          }
        });
      });
    }
  );
};

/// Hash password before saving a new user.
userSchema.pre("save", function (this: User, next) {
  bcrypt
    .hash(this.password, 10)
    .then((hashedPassword) => {
      this.password = hashedPassword;
      this.isVerified = false;
      next();
    })
    .catch((error) => {
      return next(error);
    });
});

const UserModel = model<User>("User", userSchema);

export { UserModel, authenticate, User };
