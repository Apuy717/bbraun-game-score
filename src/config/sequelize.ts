import { Sequelize } from "sequelize";
import { config as dotenv } from "dotenv";
const pg = require("pg");

dotenv();
let DB_URL: string;
if (process.env.NODE_ENV != "production") DB_URL = process.env.DB_URL_DEV as string;
else DB_URL = process.env.DB_URL_PORD as string;

const sequelize = new Sequelize(DB_URL, {
  logging: false,
  dialect: "postgres",
  dialectOptions: {
    useUTC: false,
  },
  timezone: "+07:00",
});

// const sequelize = new Sequelize("DB", "USER", "PWD", {
//   host: "127.0.0.1",
//   dialect: "mysql",
//   operatorsAliases: 0,
//   timezone: "+05:30",
// });

export default sequelize;
