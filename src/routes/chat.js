import express from "express";
import { sendMessage, getDashboard, getMoodStats, getChatHistory, deleteChat, deleteChatHistory} from "../controllers/chatController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/send",authMiddleware ,sendMessage);
router.get("/dashboard",authMiddleware,getDashboard);
router.get("/mood-stats",authMiddleware, getMoodStats);
router.get("/history",authMiddleware, getChatHistory);
router.delete("/chat/:chatId",authMiddleware, deleteChat);
router.delete("/delhistory",authMiddleware, deleteChatHistory);



export default router;
