import "reflect-metadata";
import * as http from "http";
import app from "./apps/index";
import { config as dotenv } from "dotenv";

dotenv();
const PORT = process.env.PORT || 3000;
const server = http.createServer(new app().instance);
server.listen(PORT, () => {
  console.log(`⚡️[server ${process.env.NODE_ENV}] running on PORT ${process.env.PORT}`);
});
