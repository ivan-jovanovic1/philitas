interface Pagination {
  currentPage: number;
  allPages: number;
  pageSize: number;
}
namespace Page {
  const normalized = (param: any, fallback: number) => {
    const value = Number(param);
    const isValidNumber = !Number.isNaN(value) && value > 0;
    return isValidNumber ? value : fallback;
  };

  export const normalizedPage = (param: any) => {
    return normalized(param, 1);
  };

  export const normalizedPageSize = (param: any, fallback = 25) => {
    return normalized(param, fallback);
  };

  export const beginAt = (page: number, pageSize: number) => {
    return (normalizedPage(page) - 1) * normalizedPageSize(pageSize);
  };
}
export { Pagination, Page };
