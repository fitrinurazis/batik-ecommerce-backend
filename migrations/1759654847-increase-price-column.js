'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('products', 'price', {
      type: Sequelize.DECIMAL(15, 2), // Maksimal 13 digit + 2 desimal = 999.999.999.999,99
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('products', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
  }
};
