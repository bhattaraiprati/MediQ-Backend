import { Router } from "express";
import { getAllUser, handleUserLogin, handleUserSignup, profile, verifyEmail } from "../controller/userController";

// import { createTask, deleteTask, getAllTasks, toggleStatus, updateTask } from "../controller/taskController";
import { authMiddleware } from "../middleware/authmiddleware";

const router = Router();

// base url is api/auth
try{
    router.post('/login', handleUserLogin);
    router.post('/register', handleUserSignup);
    router.get('/verify-email', verifyEmail);
    router.get('/profile', authMiddleware, profile)
    router.get('/allUsers', authMiddleware, getAllUser)


}catch(error){
    console.error('Error setting up user routes:', error);  
}
export default router;