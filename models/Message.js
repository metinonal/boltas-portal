const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  }, // Gönderen kullanıcının email'i
  receiver: {
    type: String,
    required: true,
  }, // Alıcı kullanıcının email'i
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  conversationId: {
    type: String,
    required: true,
  }, // İki kullanıcı arasındaki konuşmayı gruplamak için
})

// Konuşma ID'si oluşturmak için helper method
messageSchema.statics.createConversationId = (user1, user2) => [user1, user2].sort().join("_")

const Message = mongoose.model("Message", messageSchema)

module.exports = Message
