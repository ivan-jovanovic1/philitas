interface Pagination {
  currentPage: number;
  allPages: number;
  pageSize: number;
}

const normalized = (param: any, fallback: number) => {
  const page = Number(param);
  const isValidNumber = !Number.isNaN(page) && page > 0;

  return isValidNumber ? page : fallback;
};

const normalizedPage = (param: any) => {
  return normalized(param, 1);
};

const normalizedPageSize = (param: any, fallback = 25) => {
  return normalized(param, fallback);
};

const beginAt = (page: number, pageSize: number) => {
  const currentPage = page > 0 ? page : 1;
  return (currentPage - 1) * pageSize;
};

export { Pagination, normalizedPage, normalizedPageSize, beginAt };
