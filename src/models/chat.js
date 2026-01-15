import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    reply: {
      type: String,
      required: true,
      maxlength: 5000
    },
    mood: {
      type: String,
      enum: ['happy', 'sad', 'neutral'],
      default: 'neutral',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for efficient queries
chatSchema.index({ user: 1, createdAt: -1 });
chatSchema.index({ user: 1, mood: 1 });

// Virtual for formatted date (optional)
chatSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Enable virtuals in JSON
chatSchema.set('toJSON', { virtuals: true });
chatSchema.set('toObject', { virtuals: true });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;