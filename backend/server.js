import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from 'dotenv';
import connectDB from './config/database.js';
import apiV1Router from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import { initSocket } from './utils/socket.js';

config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(httpServer);

//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Server is alive"
    });
});

app.use('/api/v1', apiV1Router);

app.use(notFound);
app.use(errorHandler);

const StartServer = async () =>{
    try{
        await connectDB();
        httpServer.listen(port, () =>{
            console.log(`Server is running on http://localhost:${port}`);
        });
    }
    catch(error){
        console.log(`Error: ${error.message}`);
    }
}
StartServer();