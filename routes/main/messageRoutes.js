const express = require("express")
const router = express.Router()
const messageController = require("../../controllers/main/messageController")
const { authMiddleware } = require("../../middlewares/authMiddleware")

// Tüm mesaj route'ları authentication gerektirir
router.use(authMiddleware)

// Kullanıcı listesi
router.get("/api/messages/users", messageController.getUsers)

// Sohbet listesi
router.get("/api/messages/conversations", messageController.getConversations)

// Mesaj gönder
router.post("/api/messages/send", messageController.sendMessage)

// Konuşma geçmişi
router.get("/api/messages/conversation/:otherUser", messageController.getConversation)

// Okunmamış mesaj sayısı
router.get("/api/messages/unread-count", messageController.getUnreadCount)

module.exports = router
