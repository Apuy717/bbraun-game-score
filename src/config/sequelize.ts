import { Sequelize } from "sequelize";
import { config as dotenv } from "dotenv";

dotenv();
let DB_URL: string;
if (process.env.NODE_ENV != "production") DB_URL = process.env.DB_URL_DEV as string;
else DB_URL = process.env.DB_URL_PORD as string;

//postgree
// const sequelize = new Sequelize(DB_URL, {
//   logging: false,
//   dialect: "postgres",
//   dialectOptions: {
//     useUTC: false,
//   },
//   timezone: "+07:00",
// });

//mysql mariadb
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  logging: false,
  dialect: "mysql",
  timezone: "+07:00",
});

export default sequelize;
