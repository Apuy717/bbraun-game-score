import { Request, Response } from "express";
import Controller from "../utils/decorators/controller.decorator";
import { Get } from "../utils/decorators/handler.decorator";

@Controller("/")
class IndexController {
  constructor() {}

  /**
   * StatusServer
   */
  @Get("/")
  public async StatusServer(req: Request, res: Response): Promise<Response> {
    return res.status(200).send({ statusCode: 200, msg: `Server Running on Port ${process.env.PORT}` });
  }
}

export default IndexController;
