import { Router } from "express";
import { handleUserLogin, handleUserSignup } from "../controller/userController";

// import { createTask, deleteTask, getAllTasks, toggleStatus, updateTask } from "../controller/taskController";
import { authMiddleware } from "../middleware/authmiddleware";

const router = Router();
try{
    router.post('/login', handleUserLogin);
    router.post('/register', handleUserSignup);
    // router.post('/createTask', authMiddleware, createTask);
    // router.get('/getAllTask', authMiddleware, getAllTasks);
    // router.put('/updateTask', authMiddleware, updateTask);
    // router.delete('/deleteTask', authMiddleware, deleteTask);
    // router.patch('/toggleStatus', authMiddleware, toggleStatus);
}catch(error){
    console.error('Error setting up user routes:', error);  
}
export default router;