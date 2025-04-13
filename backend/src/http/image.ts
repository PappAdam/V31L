import { createImage, findImageById } from "@/db/image";
import { arrayToString, ImageResponse, serverErrorResponse } from "@common";
import { Request, Response, Router } from "express";

const imgRouter = Router();
imgRouter.get("/:id", getImage);
imgRouter.post("/create", createImg);

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

export async function createImg(req: Request, res: Response) {
  try {
    const { img, type, id, iv } = req.body;
    const image = await createImage(img, type, id, iv);

    if (!image) {
      res.status(400).json(undefined);
      return;
    }

    res.status(200).json(image.id);
  } catch (error) {
    console.error("Error creating image: ", error);
    res.status(500).json(serverErrorResponse);
  }
}
