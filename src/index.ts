
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import sequelize from './config/db';
import userRoutes from './routes/userRoutes';
import documentRoutes from './routes/documentRoutes';
import chatRoutes from './routes/chatRoutes';
import dashboardRoutes from "./routes/dashboardRoutes"
import { getDocumentWorker } from './workers/documentWorker';

dotenv.config()

const app = express();
const port = 5000

app.set('true proxy', true)

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
}));

app.use(express.json());
app.use('/api/auth', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);



app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'MediQ Backend is running' });
});

let server: any;

const startServer = async () => {
  try {
    // await sequelize.sync({ alter: true });
    // console.log('Database synchronized');
    await sequelize.authenticate();
    console.log('Database connected');

    server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`Base URL: ${process.env.BASE_URL || `http://localhost:${port}`}`);
    });
    getDocumentWorker();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();