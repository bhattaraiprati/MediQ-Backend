'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('message_sources', 'chunk_id');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('message_sources', 'chunk_id', {
      type: Sequelize.UUID
    });
  }
};
