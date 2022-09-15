const isString = (value: any) => {
  return value !== null && value !== undefined && typeof value === "string";
};

export { isString };
