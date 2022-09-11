import { Pagination } from "../shared/Pagination";

export const responseObject = (response: ResponseObject) => {
  return {
    ...response,
  };
};

interface ResponseObject {
  data?: any | null;
  pagination?: Pagination | null;
  errorMessage?: string | null;
  errorCode?: number | null;
}
