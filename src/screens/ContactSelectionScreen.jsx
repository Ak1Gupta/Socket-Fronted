import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Contacts from 'react-native-contacts';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/config';

const ContactSelectionScreen = ({ navigation, route }) => {
  const { groupId, groupName } = route.params;
  const { userSession } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupMembers, setGroupMembers] = useState(new Set());

  useEffect(() => {
    fetchGroupMembers();
  }, []);

  const fetchGroupMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (response.ok) {
        const group = await response.json();
        const memberPhones = new Set(group.members.map(member => member.phoneNumber));
        setGroupMembers(memberPhones);
        getContacts(memberPhones);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const getContacts = async (existingMemberPhones) => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts to add them to groups.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          navigation.goBack();
          return;
        }
      }

      const phoneContacts = await Contacts.getAll();
      const phoneNumbers = phoneContacts
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map(contact => contact.phoneNumbers[0].number.replace(/[^0-9]/g, ''))
        .filter(number => !existingMemberPhones.has(number));

      if (phoneNumbers.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/check-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumbers }),
      });

      if (!response.ok) {
        throw new Error('Failed to check contacts');
      }

      const { users: registeredUsers } = await response.json();

      const processedContacts = phoneContacts
        .filter(contact => {
          if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) return false;
          const phoneNumber = contact.phoneNumbers[0].number.replace(/[^0-9]/g, '');
          return !existingMemberPhones.has(phoneNumber);
        })
        .map(contact => {
          const phoneNumber = contact.phoneNumbers[0].number.replace(/[^0-9]/g, '');
          const registeredUser = registeredUsers?.find(user => 
            user.phoneNumber === phoneNumber
          );
          
          return {
            id: contact.recordID,
            name: `${contact.givenName || ''} ${contact.familyName || ''}`.trim(),
            phoneNumber: phoneNumber,
            registered: !!registeredUser,
            username: registeredUser?.username,
          };
        })
        .sort((a, b) => {
          if (a.registered && !b.registered) return -1;
          if (!a.registered && b.registered) return 1;
          return a.name.localeCompare(b.name);
        });

      setContacts(processedContacts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contacts:', error.message);
      setLoading(false);
    }
  };

  const toggleContact = (contact) => {
    if (!contact.registered) return;

    setSelectedContacts(prev => {
      if (prev.includes(contact.username)) {
        return prev.filter(username => username !== contact.username);
      } else {
        return [...prev, contact.username];
      }
    });
  };

  const handleAddMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernames: selectedContacts,
          addedBy: userSession.username,
        }),
      });

      if (response.ok) {
        navigation.navigate('Chat', {
          groupId,
          groupName,
          username: userSession.username,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.contactItem,
        !item.registered && styles.disabledContact,
        selectedContacts.includes(item.username) && styles.selectedContact,
      ]}
      onPress={() => toggleContact(item)}
      disabled={!item.registered}
    >
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
        {item.registered && (
          <Text style={styles.username}>@{item.username}</Text>
        )}
      </View>
      {item.registered && selectedContacts.includes(item.username) && (
        <Icon name="check-circle" size={24} color="#4c669f" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c669f" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#192f6a', '#3b5998', '#4c669f']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Members</Text>
        {selectedContacts.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddMembers}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="contacts" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No contacts found</Text>
          <Text style={styles.emptySubText}>
            Your contacts will appear here once you grant permission and have contacts on your device
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.contactsList}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  addButtonText: {
    color: '#192f6a',
    fontWeight: 'bold',
  },
  contactsList: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    height: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  disabledContact: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  selectedContact: {
    backgroundColor: '#e3e9ff',
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#4c669f',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ContactSelectionScreen; 