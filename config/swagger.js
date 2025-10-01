const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../docs/swagger-output.json");

module.exports = {
  swaggerUi,
  swaggerSpec: swaggerDocument,
};
