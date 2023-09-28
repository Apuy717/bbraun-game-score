import express, { Application as ExApplication, Handler } from "express";
import { IRouter } from "../utils/decorators/handler.decorator";
import { MetadataKeys } from "../utils/metadata.keys";
import * as path from "path";
import * as fs from "fs";
import bodyParser from "body-parser";

class App {
  private readonly _instance: ExApplication;

  get instance(): ExApplication {
    return this._instance;
  }

  constructor() {
    console.clear();
    this._instance = express();
    this._instance.use(express.json());
    this.LoadRouter();
  }

  private async LoadRouter() {
    const parentFolderPath = path.join(__dirname, "../controllers");
    const controller = await this.LoadController(parentFolderPath);

    const info: Array<{ api: string; handler: string }> = [];
    //body parser
    this._instance.use(bodyParser.urlencoded({ extended: false }));
    // parse application/json
    this._instance.use(bodyParser.json());

    controller.forEach((c) => {
      const modules = require(c);
      const keys = Object.keys(modules);
      if (keys.length > 0) {
        const controllerClass = modules[keys[0]];
        const controllerInstance: { [handleName: string]: Handler } = new controllerClass() as any;
        const basePath: string = Reflect.getMetadata(MetadataKeys.BASE_PATH, controllerClass);
        const routers: IRouter[] = Reflect.getMetadata(MetadataKeys.ROUTERS, controllerClass);
        const exRouter = express.Router();
        routers.forEach(({ method, path, handlerName }) => {
          exRouter[method](path, controllerInstance[String(handlerName)].bind(controllerInstance));
          info.push({
            api: `${method.toLocaleUpperCase()} ${basePath + path}`,
            handler: `${controllerClass.name}.${String(handlerName)}`,
          });
        });
        this._instance.use(basePath, exRouter);
      }
    });
    console.table(info);
  }

  private async LoadController(parentFolderPath: string) {
    const files: string[] = [];

    const dirents = await fs.promises.readdir(parentFolderPath, { withFileTypes: true });
    for (const dirent of dirents) {
      const filePath = path.join(parentFolderPath, dirent.name);

      if (dirent.isDirectory()) {
        const nestedFiles = await this.LoadController(filePath);
        files.push(...nestedFiles);
      } else {
        files.push(filePath);
      }
    }

    return files;
  }
}

export default App;
