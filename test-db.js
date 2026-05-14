// test-db.js
require('dotenv').config();

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing in .env file");
  process.exit(1);
}

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Successfully Connected to Neon Database!');
    console.log('Database is ready for migrations.');
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

testConnection();