'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      title: { type: Sequelize.STRING, allowNull: false },
      original_name: { type: Sequelize.STRING, allowNull: false },
      cloudinary_url: { type: Sequelize.STRING, allowNull: false },
      file_type: { type: Sequelize.STRING, allowNull: false },
      processing_status: { type: Sequelize.STRING, allowNull: false },
      total_chunks: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('documents');
  }
};