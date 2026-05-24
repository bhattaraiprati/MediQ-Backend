'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'isVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('users', 'verificationToken', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'isVerified');
    await queryInterface.removeColumn('users', 'verificationToken');
  }
};
