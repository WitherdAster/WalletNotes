const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "gondola.proxy.rlwy.net",
  user: "root",
  password: "OrsDfvsfCfFnUukfpkrgBOHvPbcDslWX",
  database: "railway",
  port: 34771,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Database connected");
  }
});

module.exports = db;
