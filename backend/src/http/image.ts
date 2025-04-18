import { findImageById } from "@/db/image";
import { ImageResponse, serverErrorResponse } from "@common";
import { Request, Response, Router } from "express";

const imgRouter = Router();
imgRouter.get("/:id", getImage);

export default imgRouter;

interface GetImageParams {
  id: string;
}

export async function getImage(
  req: Request<GetImageParams>,
  res: Response<ImageResponse>
) {
  try {
    const id = req.params.id;
    const img = await findImageById(id);

    if (!img) {
      res.status(404).json(undefined);
      return;
    }

    res.status(200).json(img);
  } catch (error) {
    console.error("Error during getting and image: ", error);
    res.status(500).json(serverErrorResponse);
  }
}
