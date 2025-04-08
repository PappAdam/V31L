export type ImageResponse = ImageError | ImageSuccess;
export type ImageError = {
  result: "Error";
  message: "img not found";
};

export const imgError: ImageError = {
  result: "Error",
  message: "img not found",
};

export type ImageSuccess = {
  result: "Success";
  data: String;
};

export const imgSuccess = (data: String): ImageSuccess => {
  return {
    result: "Success",
    data,
  };
};
