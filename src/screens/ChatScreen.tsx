import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
}

const SOCKET_URL = 'ws://192.1.125.209:8080/ws';

const ChatScreen = ({route}: any) => {
  const {username} = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    ws.current = new WebSocket(SOCKET_URL);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket');
      sendJoinMessage();
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prevMessages => [...prevMessages, message]);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket');
      
      setMessages(prevMessages => [...prevMessages, 
        {
          id: Date.now().toString(),
          content: 'Disconnected from the chat.',
          sender: 'System',
          timestamp: new Date().toISOString(),
          type: 'LEAVE',
        },
      ]);
    };
  };

  const sendJoinMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        id: Date.now().toString(),
        sender: username,
        type: 'JOIN',
        content: 'Joined the chat.',
        timestamp: new Date().toISOString(),
      };
      ws.current.send(JSON.stringify(message));
    }
  };

  const sendMessage = () => {
    if (messageText.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        id: Date.now().toString(),
        content: messageText,
        sender: username,
        type: 'CHAT',
        timestamp: new Date().toISOString(),
      };
      ws.current.send(JSON.stringify(message));
      setMessageText('');
    }
  };

  const renderMessage = ({item}: {item: Message}) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === username ? styles.ownMessage : styles.otherMessage,
      ]}>
      <Text style={styles.sender}>{item.sender}</Text>
      <Text 
        style={[
          item.type!=='CHAT'?styles.messageTypeText: styles.messageText,
          item.sender === username ? styles.ownMessageText : styles.otherMessageText,
        ]}>
        {item.content}
      </Text>
      {item.timestamp && (
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '80%',
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#E8E8E8',
    alignSelf: 'flex-start',
  },
  sender: {
    fontSize: 12,
    marginBottom: 4,
    color: '#fff',
  },
  messageText: {
    fontSize: 16,
    color:'#fff'
  },
  messageTypeText: {
    fontSize: 12,
    color:'#333'
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatScreen; 