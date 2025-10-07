'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'images', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'image_url'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('products', 'images');
  }
};
