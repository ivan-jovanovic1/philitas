import { ResponseWithStatus } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";
import { isString } from "../shared/SharedHelpers";

export const isTokenValid = (token: string | undefined) => {
  if (!isString(token)) return false;

  return token!.length >= 128;
};

export const isTokenNotValidResponse = (
  token: string | undefined
): ResponseWithStatus | null => {
  if (!isTokenValid(token)) {
    return {
      statusCode: 401,
      response: {
        errorCode: ErrorCode.undefinedData,
        errorMessage: "Token not valid.",
      },
    };
  }
  return null;
};
