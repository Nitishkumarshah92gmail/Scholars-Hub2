import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessageAt: { type: Date, default: Date.now },
  lastMessagePreview: { type: String, default: '' }
}, { timestamps: true });

// Ensure unique conversations between the same users
conversationSchema.index({ participants: 1 });

export default mongoose.model('Conversation', conversationSchema);
