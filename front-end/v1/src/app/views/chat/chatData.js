// Dummy users data
export const dummyUsers = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://via.placeholder.com/40/1976d2/ffffff?text=J',
    status: 'online',
    lastMessage: 'Hey, how are you doing?',
    lastMessageTime: '2:30 PM',
    unreadCount: 2
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    avatar: 'https://via.placeholder.com/40/e91e63/ffffff?text=S',
    status: 'online',
    lastMessage: 'The project is ready for review',
    lastMessageTime: '1:45 PM',
    unreadCount: 0
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: 'https://via.placeholder.com/40/4caf50/ffffff?text=M',
    status: 'offline',
    lastMessage: 'Thanks for the update!',
    lastMessageTime: '12:20 PM',
    unreadCount: 1
  },
  {
    id: '4',
    name: 'Emily Davis',
    avatar: 'https://via.placeholder.com/40/ff9800/ffffff?text=E',
    status: 'online',
    lastMessage: 'Can we schedule a meeting?',
    lastMessageTime: '11:15 AM',
    unreadCount: 0
  },
  {
    id: '5',
    name: 'David Brown',
    avatar: 'https://via.placeholder.com/40/9c27b0/ffffff?text=D',
    status: 'offline',
    lastMessage: "I'll send you the files tomorrow",
    lastMessageTime: '10:30 AM',
    unreadCount: 0
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    avatar: 'https://via.placeholder.com/40/607d8b/ffffff?text=L',
    status: 'online',
    lastMessage: 'Great work on the presentation!',
    lastMessageTime: '9:45 AM',
    unreadCount: 3
  },
  {
    id: '7',
    name: 'Tom Wilson',
    avatar: 'https://via.placeholder.com/40/f44336/ffffff?text=T',
    status: 'offline',
    lastMessage: 'See you at the meeting',
    lastMessageTime: 'Yesterday',
    unreadCount: 0
  },
  {
    id: '8',
    name: 'Anna Martinez',
    avatar: 'https://via.placeholder.com/40/795548/ffffff?text=A',
    status: 'online',
    lastMessage: 'The client loved the proposal',
    lastMessageTime: 'Yesterday',
    unreadCount: 0
  }
]

// Dummy messages data
export const dummyMessages = [
  {
    id: 1,
    userId: '1',
    text: 'Hey, how are you doing?',
    sender: 'other',
    timestamp: '2:30 PM',
    user: {
      name: 'John Doe',
      avatar: 'https://via.placeholder.com/40/1976d2/ffffff?text=J'
    }
  },
  {
    id: 2,
    userId: '1',
    text: "I'm doing great! How about you?",
    sender: 'me',
    timestamp: '2:32 PM',
    user: {
      name: 'Me',
      avatar: 'https://via.placeholder.com/40/1976d2/ffffff?text=M'
    }
  },
  {
    id: 3,
    userId: '1',
    text: 'Pretty good! Just working on the new project',
    sender: 'other',
    timestamp: '2:33 PM',
    user: {
      name: 'John Doe',
      avatar: 'https://via.placeholder.com/40/1976d2/ffffff?text=J'
    }
  },
  {
    id: 4,
    userId: '2',
    text: 'The project is ready for review',
    sender: 'other',
    timestamp: '1:45 PM',
    user: {
      name: 'Sarah Wilson',
      avatar: 'https://via.placeholder.com/40/e91e63/ffffff?text=S'
    }
  },
  {
    id: 5,
    userId: '2',
    text: "Perfect! I'll take a look at it",
    sender: 'me',
    timestamp: '1:47 PM',
    user: {
      name: 'Me',
      avatar: 'https://via.placeholder.com/40/1976d2/ffffff?text=M'
    }
  },
  {
    id: 6,
    userId: '3',
    text: 'Thanks for the update!',
    sender: 'other',
    timestamp: '12:20 PM',
    user: {
      name: 'Mike Johnson',
      avatar: 'https://via.placeholder.com/40/4caf50/ffffff?text=M'
    }
  },
  {
    id: 7,
    userId: '4',
    text: 'Can we schedule a meeting?',
    sender: 'other',
    timestamp: '11:15 AM',
    user: {
      name: 'Emily Davis',
      avatar: 'https://via.placeholder.com/40/ff9800/ffffff?text=E'
    }
  },
  {
    id: 8,
    userId: '4',
    text: 'Sure! What time works for you?',
    sender: 'me',
    timestamp: '11:17 AM',
    user: {
      name: 'Me',
      avatar: 'https://via.placeholder.com/40/1976d2/ffffff?text=M'
    }
  },
  {
    id: 9,
    userId: '5',
    text: "I'll send you the files tomorrow",
    sender: 'other',
    timestamp: '10:30 AM',
    user: {
      name: 'David Brown',
      avatar: 'https://via.placeholder.com/40/9c27b0/ffffff?text=D'
    }
  },
  {
    id: 10,
    userId: '6',
    text: 'Great work on the presentation!',
    sender: 'other',
    timestamp: '9:45 AM',
    user: {
      name: 'Lisa Anderson',
      avatar: 'https://via.placeholder.com/40/607d8b/ffffff?text=L'
    }
  },
  {
    id: 11,
    userId: '6',
    text: 'Thank you! I put a lot of effort into it',
    sender: 'me',
    timestamp: '9:47 AM',
    user: {
      name: 'Me',
      avatar: 'https://via.placeholder.com/40/1976d2/ffffff?text=M'
    }
  },
  {
    id: 12,
    userId: '6',
    text: 'It really shows! The client was impressed',
    sender: 'other',
    timestamp: '9:50 AM',
    user: {
      name: 'Lisa Anderson',
      avatar: 'https://via.placeholder.com/40/607d8b/ffffff?text=L'
    }
  },
  {
    id: 13,
    userId: '7',
    text: 'See you at the meeting',
    sender: 'other',
    timestamp: 'Yesterday',
    user: {
      name: 'Tom Wilson',
      avatar: 'https://via.placeholder.com/40/f44336/ffffff?text=T'
    }
  },
  {
    id: 14,
    userId: '8',
    text: 'The client loved the proposal',
    sender: 'other',
    timestamp: 'Yesterday',
    user: {
      name: 'Anna Martinez',
      avatar: 'https://via.placeholder.com/40/795548/ffffff?text=A'
    }
  }
]
