import { Router } from 'express';
import { authMiddleware } from '../middleware/authmiddleware';
import { chat, deleteChat, getAllChats, getChatMessages } from '../controller/chatController';
import chatRoomMiddleware from '../middleware/chatRoomMiddleware';
import { setupAssociations } from '../models/associations';

const router = Router();

router.use(authMiddleware);

setupAssociations();

router.post("/", chatRoomMiddleware , chat);  
router.get("/", getAllChats);                
router.get("/:chat_id", getChatMessages);            
router.delete("/:chat_id", deleteChat); 

export default router;
