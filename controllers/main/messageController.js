const Message = require("../../models/Message")
const User = require("../../models/User") // MongoDB User modelini kullan
const { sql } = require("../../config/config")

// Kullanıcıların listesini getir (mesajlaşma için)
exports.getUsers = async (req, res) => {
  try {
    const currentUserEmail = req.session.user?.EMail
    if (!currentUserEmail) {
      return res.status(401).json({ error: "Oturum bulunamadı" })
    }

    const users = await User.find(
      {
        email: { $ne: currentUserEmail }, // Mevcut kullanıcıyı hariç tut
        Adi: { $exists: true }, // Ad alanı olan kullanıcıları getir
        Soyadi: { $exists: true }, // Soyad alanı olan kullanıcıları getir
      },
      {
        email: 1,
        Adi: 1,
        Soyadi: 1,
        Departman: 1,
        Unvan: 1,
        displayName: 1,
      },
    ).sort({ Adi: 1, Soyadi: 1 })

    const formattedUsers = users.map((user) => ({
      EMail: user.email,
      Adi: user.Adi || "",
      Soyadi: user.Soyadi || "",
      Departman: user.Departman || "",
      Unvan: user.Unvan || "",
      displayName: user.displayName || "",
    }))

    res.json(formattedUsers)
  } catch (error) {
    console.error("Kullanıcılar getirilirken hata:", error)
    res.status(500).json({ error: "Sunucu hatası" })
  }
}

// Mesaj gönder
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, message } = req.body
    const sender = req.session.user?.EMail

    if (!sender) {
      return res.status(401).json({ error: "Oturum bulunamadı" })
    }

    if (!receiver || !message) {
      return res.status(400).json({ error: "Alıcı ve mesaj gerekli" })
    }

    const conversationId = Message.createConversationId(sender, receiver)

    const newMessage = new Message({
      sender,
      receiver,
      message,
      conversationId,
    })

    await newMessage.save()
    res.json({ success: true, message: newMessage })
  } catch (error) {
    console.error("Mesaj gönderilirken hata:", error)
    res.status(500).json({ error: "Sunucu hatası" })
  }
}

// Konuşma geçmişini getir
exports.getConversation = async (req, res) => {
  try {
    const { otherUser } = req.params
    const currentUser = req.session.user?.EMail

    if (!currentUser) {
      return res.status(401).json({ error: "Oturum bulunamadı" })
    }

    const conversationId = Message.createConversationId(currentUser, otherUser)

    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 }).limit(50) // Son 50 mesaj

    res.json(messages)
  } catch (error) {
    console.error("Konuşma getirilirken hata:", error)
    res.status(500).json({ error: "Sunucu hatası" })
  }
}

exports.markAsRead = async (req, res) => {
  try {
    const { sender } = req.body
    const currentUser = req.session.user?.EMail

    if (!currentUser) {
      return res.status(401).json({ error: "Oturum bulunamadı" })
    }

    const conversationId = Message.createConversationId(currentUser, sender)

    // Okunmamış mesajları okundu olarak işaretle
    const result = await Message.updateMany(
      {
        conversationId,
        receiver: currentUser,
        isRead: false,
      },
      { isRead: true },
    )

    res.json({ success: true, modifiedCount: result.modifiedCount })
  } catch (error) {
    console.error("Mesajlar okundu işaretlenirken hata:", error)
    res.status(500).json({ error: "Sunucu hatası" })
  }
}

// Okunmamış mesaj sayısını getir
exports.getUnreadCount = async (req, res) => {
  try {
    const currentUser = req.session.user?.EMail

    if (!currentUser) {
      return res.status(401).json({ error: "Oturum bulunamadı" })
    }

    const unreadCount = await Message.countDocuments({
      receiver: currentUser,
      isRead: false,
    })

    res.json({ unreadCount })
  } catch (error) {
    console.error("Okunmamış mesaj sayısı getirilirken hata:", error)
    res.status(500).json({ error: "Sunucu hatası" })
  }
}

exports.getConversations = async (req, res) => {
  try {
    const currentUser = req.session.user?.EMail

    if (!currentUser) {
      return res.status(401).json({ error: "Oturum bulunamadı" })
    }

    // Kullanıcının dahil olduğu tüm konuşmaları bul
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUser }, { receiver: currentUser }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ["$receiver", currentUser] }, { $eq: ["$isRead", false] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { "lastMessage.timestamp": -1 },
      },
    ])

    // Her konuşma için diğer kullanıcının bilgilerini getir
    const conversationsWithUserInfo = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = conv.lastMessage
        const otherUserEmail = lastMessage.sender === currentUser ? lastMessage.receiver : lastMessage.sender

        // Diğer kullanıcının bilgilerini getir
        const otherUser = await User.findOne(
          { email: otherUserEmail },
          { email: 1, Adi: 1, Soyadi: 1, Departman: 1, displayName: 1 },
        )

        return {
          conversationId: conv._id,
          otherUser: {
            EMail: otherUserEmail,
            Adi: otherUser?.Adi || "",
            Soyadi: otherUser?.Soyadi || "",
            Departman: otherUser?.Departman || "",
            displayName: otherUser?.displayName || "",
          },
          lastMessage: {
            message: lastMessage.message,
            timestamp: lastMessage.timestamp,
            sender: lastMessage.sender,
          },
          unreadCount: conv.unreadCount,
        }
      }),
    )

    res.json(conversationsWithUserInfo)
  } catch (error) {
    console.error("Konuşmalar getirilirken hata:", error)
    res.status(500).json({ error: "Sunucu hatası" })
  }
}
