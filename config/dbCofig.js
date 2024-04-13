module.exports = {
  // HOST: "34.143.170.195",
  HOST: "localhost",
  // USER: "root1",
  USER: "root",
  PASSWORD: "root",
  DB: "node_sequelize",
  dialect: "mysql",

  pool: {
    max: 5,
    min: 0,
    acquire: 3000,
    idle: 10000,
  },
};
