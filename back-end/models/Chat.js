import mongoose, { Schema } from 'mongoose'

// Message Schema
const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video'],
      default: 'text'
    },
    fileUrl: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: null
    },
    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'user'
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// Conversation Schema
const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['individual', 'group'],
      required: true
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
      }
    ],
    // For group chats
    groupName: {
      type: String,
      trim: true
    },
    groupDescription: {
      type: String,
      trim: true
    },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },
    groupImage: {
      type: String,
      default: null
    },
    // For individual chats
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map()
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // For individual chats - to identify unique conversations
    individualChatId: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
)

// Create indexes for better performance
conversationSchema.index({ participants: 1 })
conversationSchema.index({ individualChatId: 1 })
conversationSchema.index({ lastMessageAt: -1 })
messageSchema.index({ conversation: 1, createdAt: -1 })

// Pre-save middleware to generate individualChatId for individual conversations
conversationSchema.pre('save', function (next) {
  if (this.type === 'individual' && this.participants.length === 2) {
    // Sort participant IDs to ensure consistent individualChatId
    const sortedParticipants = this.participants.map((p) => p.toString()).sort()
    this.individualChatId = `${sortedParticipants[0]}_${sortedParticipants[1]}`
  }
  next()
})

// Virtual for getting conversation name
conversationSchema.virtual('conversationName').get(function () {
  if (this.type === 'group') {
    return this.groupName
  }
  return null // For individual chats, name will be resolved in the application layer
})

// Methods
conversationSchema.methods.addParticipant = function (userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId)
  }
  return this.save()
}

conversationSchema.methods.removeParticipant = function (userId) {
  this.participants = this.participants.filter(
    (p) => p.toString() !== userId.toString()
  )
  return this.save()
}

conversationSchema.methods.markAsRead = function (userId) {
  this.unreadCount.set(userId.toString(), 0)
  return this.save()
}

conversationSchema.methods.incrementUnreadCount = function (userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0
  this.unreadCount.set(userId.toString(), currentCount + 1)
  return this.save()
}

// Static methods with atomic operations to prevent concurrency issues
conversationSchema.statics.markAsReadAtomic = async function (
  conversationId,
  userId
) {
  return this.findByIdAndUpdate(
    conversationId,
    {
      $set: {
        [`unreadCount.${userId}`]: 0
      }
    },
    { new: true }
  )
}

conversationSchema.statics.incrementUnreadCountAtomic = async function (
  conversationId,
  userId
) {
  return this.findByIdAndUpdate(
    conversationId,
    {
      $inc: {
        [`unreadCount.${userId}`]: 1
      }
    },
    { new: true }
  )
}

// Static methods
conversationSchema.statics.findOrCreateIndividualChat = async function (
  user1Id,
  user2Id
) {
  const sortedParticipants = [user1Id, user2Id].map((p) => p.toString()).sort()
  const individualChatId = `${sortedParticipants[0]}_${sortedParticipants[1]}`

  let conversation = await this.findOne({ individualChatId })

  if (!conversation) {
    conversation = new this({
      type: 'individual',
      participants: [user1Id, user2Id],
      individualChatId
    })
    await conversation.save()
  }

  return conversation
}

conversationSchema.statics.findUserConversations = async function (
  userId,
  limit = 20,
  skip = 0
) {
  return this.find({
    participants: userId,
    isActive: true
  })
    .populate('participants', 'name userID email')
    .populate('lastMessage')
    .populate('groupAdmin', 'name userID')
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .skip(skip)
}

// Message Schema
const Message = mongoose.model('Message', messageSchema)

// Conversation Schema
const Conversation = mongoose.model('Conversation', conversationSchema)

export { Conversation, Message }
