import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL, SOCKET_URL } from '../config/config';
import { useFocusEffect } from '@react-navigation/native';

const ChatScreen = ({navigation, route}) => {
  const { groupId, groupName, username } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    fetchExistingMessages();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [groupId]);

  useFocusEffect(
    React.useCallback(() => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
      return () => {
        // No cleanup needed here as main useEffect handles it
      };
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Clean up modals when screen loses focus
        setShowMenu(false);
        setShowDetailsModal(false);
      };
    }, [])
  );

  const fetchExistingMessages = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/group/${groupId}?username=${username}`
      );
      if (response.ok) {
        const data = await response.json();
        const sortedMessages = data.sort((a, b) => {
          const timeA = new Date(a.sentAt || a.timestamp);
          const timeB = new Date(b.sentAt || b.timestamp);
          return timeA - timeB;
        });
        setMessages(sortedMessages);
      } else {
        console.error('Failed to fetch messages:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const connectWebSocket = () => {
    ws.current = new WebSocket(`${SOCKET_URL}?groupId=${groupId}&username=${username}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket for group:', groupId);
      setTimeout(() => {
        try {
          const joinMessage = {
            type: 'JOIN',
            groupId: groupId,
            sender: username,
            content: `${username} joined the chat`,
            timestamp: new Date().toISOString()
          };
          if (ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(joinMessage));
          }
        } catch (error) {
          console.error('Error sending join message:', error);
        }
      }, 500);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'JOIN') {
          return;
        } 
        
        console.log('Received message:', message);
        
        if (message.groupId === groupId) {
          setMessages(prevMessages => {
            // Check if message already exists in state
            const messageExists = prevMessages.some(m => 
              m.id === message.id || 
              (m.content === message.content && 
               m.sender === message.sender && 
               Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 1000)
            );

            if (!messageExists) {
              return [...prevMessages, {
                ...message,
                id: message.id || Date.now().toString(),
                timestamp: message.timestamp || new Date().toISOString(),
              }];
            }
            return prevMessages;
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setTimeout(connectWebSocket, 3000);
    };
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollToEnd();
    }
  }, [messages]);

  const handleAddMember = () => {
    navigation.navigate('ContactSelection', {
      groupId: route.params.groupId,
      groupName: groupName
    });
  };

  const sendMessage = () => {
    if (messageText.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        id: Date.now().toString(),
        content: messageText.trim(),
        sender: username,
        type: 'CHAT',
        timestamp: new Date().toISOString(),
        groupId: groupId
      };

      console.log('Sending message:', message);

      // Send through WebSocket only
      ws.current.send(JSON.stringify(message));
      
      // Clear input
      setMessageText('');
    }
  };

  const renderMessage = ({item}) => {
    if (item.type === 'SYSTEM') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
          {item.timestamp && (
            <Text style={styles.systemMessageTimestamp}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.sender === username ? styles.ownMessage : styles.otherMessage,
        ]}>
        <Text style={styles.sender}>{item.sender}</Text>
        <Text 
          style={[
            styles.messageText,
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
  };

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setGroupDetails(data);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                navigation.goBack();
              } else {
                Alert.alert("Error", "Failed to delete group");
              }
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert("Error", "Failed to delete group");
            }
          }
        }
      ]
    );
  };

  const renderDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#192f6a', '#3b5998', '#4c669f']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Group Details</Text>
            <TouchableOpacity
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {groupDetails && (
            <View style={styles.detailsContainer}>
              <Text style={styles.groupDetailName}>{groupDetails.name}</Text>
              <Text style={styles.adminText}>
                Admin: {groupDetails.createdBy.username}
              </Text>
              <Text style={styles.membersTitle}>Members:</Text>
              <FlatList
                data={groupDetails.members}
                renderItem={({item}) => (
                  <View style={styles.memberItem}>
                    <Text style={styles.memberName}>{item.username}</Text>
                  </View>
                )}
                keyExtractor={item => item.id.toString()}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderMenu = () => (
    <Modal
      visible={showMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMenu(false)}
    >
      <TouchableOpacity 
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setShowMenu(false)}
      >
        <View style={styles.menuContent}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);  // Close menu first
              setTimeout(() => {    // Then navigate
                handleAddMember();
              }, 100);
            }}
          >
            <Icon name="person-add" size={24} color="#4c669f" />
            <Text style={styles.menuText}>Add Member</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);  // Close menu first
              setTimeout(() => {    // Then show details
                fetchGroupDetails();
                setShowDetailsModal(true);
              }, 100);
            }}
          >
            <Icon name="info" size={24} color="#4c669f" />
            <Text style={styles.menuText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.deleteMenuItem]}
            onPress={() => {
              setShowMenu(false);  // Close menu first
              setTimeout(() => {    // Then show delete alert
                handleDeleteGroup();
              }, 100);
            }}
          >
            <Icon name="delete" size={24} color="#ff4444" />
            <Text style={[styles.menuText, styles.deleteText]}>Delete Group</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#192f6a', '#3b5998', '#4c669f']}
        style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupList')}
            style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {groupName}
          </Text>
          
          <TouchableOpacity
            onPress={() => {
              if (!showMenu) {  // Only set to true if currently false
                setShowMenu(true);
              }
            }}
            style={styles.menuButton}>
            <Icon name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        ref={messagesEndRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id?.toString() || Date.now().toString()}
        style={styles.messagesList}
        onContentSizeChange={() => messagesEndRef.current?.scrollToEnd()}
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

      {renderMenu()}
      {renderDetailsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 16,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
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
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  messageTypeText: {
    fontSize: 12,
    color: '#333',
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
  systemMessage: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    maxWidth: '90%',
    borderRadius: 16,
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  systemMessageContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignSelf: 'center',
    maxWidth: '90%',
    elevation: 1,
  },
  systemMessageText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  systemMessageTimestamp: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContent: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#ff4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  detailsContainer: {
    padding: 16,
  },
  groupDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  adminText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
});

export default ChatScreen; 