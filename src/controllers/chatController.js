import mongoose from "mongoose";
import Chat from "../models/chat.js";
import { getGroqResponse } from "../utils/gptClient.js";
import { analyzeMood } from "../utils/sentiment.js";

// Send Message and Get AI Response
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    // Validate message
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ msg: "Message is required" });
    }

    // Fetch recent conversation history (last 10 chats)
    const recent = await Chat.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Build conversation history for context
    const history = recent
      .reverse()
      .flatMap(doc => ([
        { role: "user", content: doc.message },
        ...(doc.reply ? [{ role: "assistant", content: doc.reply }] : [])
      ]));

    // Detect mood from user message
    const mood = analyzeMood(message);

    // Get AI response with context
    const aiReply = await getGroqResponse([
      ...history,
      { role: "user", content: message }
    ]);

    // Validate AI response
    if (!aiReply || aiReply.trim() === "") {
      return res.status(502).json({ msg: "Empty AI response" });
    }

    // Save chat to database
    const chat = await Chat.create({
      user: userId,
      message: message.trim(),
      reply: aiReply,
      mood
    });

    return res.status(200).json({ 
      success: true,
      reply: aiReply, 
      mood,
      chatId: chat._id 
    });

  } catch (err) {
    console.error("Chat error:", err);
    return res.status(502).json({ 
      success: false,
      msg: "AI service unavailable. Please try again later." 
    });
  }
};

// Get Dashboard Data
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    // Run all queries in parallel for better performance
    const [recentChats, moodStats, totalCount] = await Promise.all([
      Chat.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('message reply mood createdAt')
        .lean(),
      
      Chat.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$mood", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      Chat.countDocuments({ user: userId })
    ]);

    // Format mood stats for easier frontend consumption
    const formattedMoodStats = moodStats.reduce((acc, item) => {
      acc[item._id || 'neutral'] = item.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalChats: totalCount,
        recentChats,
        moodStats: formattedMoodStats,
        moodBreakdown: moodStats
      }
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ 
      success: false,
      msg: "Error fetching dashboard data" 
    });
  }
};

// Get Mood Statistics
export const getMoodStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    const moodStats = await Chat.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Calculate percentages
    const total = moodStats.reduce((sum, stat) => sum + stat.count, 0);
    const statsWithPercentage = moodStats.map(stat => ({
      mood: stat._id || 'neutral',
      count: stat.count,
      percentage: total > 0 ? ((stat.count / total) * 100).toFixed(2) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: statsWithPercentage,
        total
      }
    });

  } catch (err) {
    console.error("Mood stats error:", err);
    res.status(500).json({ 
      success: false,
      msg: "Error fetching mood statistics" 
    });
  }
};

// Get Chat History with Pagination
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

    // Fetch chats and total count in parallel
    const [chats, total] = await Promise.all([
      Chat.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select('message reply mood createdAt')
        .lean(),
      
      Chat.countDocuments({ user: userId })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        chats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error("Chat history error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Error fetching chat history" 
    });
  }
};

// Delete Chat History (Optional - for user privacy)
export const deleteChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    const result = await Chat.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      msg: "Chat history deleted successfully",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Delete history error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Error deleting chat history" 
    });
  }
};

// Delete Single Chat
export const deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    // Validate IDs
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ msg: "Invalid chat ID" });
    }

    // Find and delete chat (only if it belongs to the user)
    const chat = await Chat.findOneAndDelete({ 
      _id: chatId, 
      user: userId 
    });

    if (!chat) {
      return res.status(404).json({ 
        success: false,
        msg: "Chat not found" 
      });
    }

    res.status(200).json({
      success: true,
      msg: "Chat deleted successfully"
    });

  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Error deleting chat" 
    });
  }
};