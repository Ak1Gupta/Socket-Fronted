import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/config';
const {width} = Dimensions.get('window');

const GroupListScreen = ({navigation}) => {
  const { logout, userSession } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/user/${userSession?.username}`);
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (userSession?.username) {
        fetchGroups();
      }
    }, [userSession?.username])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const handleLogout = async () => {
    try {
      const logoutSuccess = await logout();
      if (logoutSuccess) {
        navigation.navigate('PhoneAuth');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!userSession) {
    return null;
  }

  const renderGroup = ({item, index}) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      delay={index * 50}
      style={styles.groupCardContainer}>
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => handleGroupPress(item)}>
        <View style={styles.groupAvatarContainer}>
          <Text style={styles.groupAvatar}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.memberCount}>
            {item.members.length} {item.members.length === 1 ? 'member' : 'members'}
          </Text>
          <Text style={styles.createdBy}>
            Created by {item.createdBy.username === userSession.username ? 'you' : item.createdBy.username}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color="#4c669f" />
      </TouchableOpacity>
    </Animatable.View>
  );

  const handleGroupPress = (group) => {
    navigation.navigate('Chat', {
      groupId: group.id,
      groupName: group.name,
      username: userSession.username,
      groupAdmin: group.createdBy.username
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#192f6a" />
      
      <Animatable.View 
        animation="fadeIn" 
        duration={1000} 
        style={styles.headerContainer}>
        <LinearGradient
          colors={['#192f6a', '#3b5998', '#4c669f']}
          style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Animatable.Text 
              animation="fadeInDown" 
              duration={1000} 
              style={styles.headerTitle}>
              Aora
            </Animatable.Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Icon name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Animatable.Text 
            animation="fadeInUp" 
            duration={1000}
            style={styles.welcomeText}>
            Welcome back, {userSession.firstName || userSession.username}
          </Animatable.Text>
        </LinearGradient>
      </Animatable.View>

      <FlatList
        data={groups}
        renderItem={(renderGroup)}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.groupList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4c669f']} 
          />
        }
        ListEmptyComponent={
          !isLoading && (
            <Animatable.View 
              animation="fadeIn" 
              duration={1000} 
              style={styles.emptyContainer}>
              <Icon name="group" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No groups yet
              </Text>
              <Text style={styles.emptySubText}>
                Create a group to start chatting!
              </Text>
            </Animatable.View>
          )
        }
      />

      <Animatable.View
        animation="bounceIn"
        duration={1500}
        style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateGroup', {
            username: userSession.username
          })}>
          <LinearGradient
            colors={['#4c669f', '#3b5998', '#192f6a']}
            style={styles.fabGradient}>
            <Icon name="add" size={30} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 5,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  groupList: {
    padding: 15,
  },
  groupCardContainer: {
    marginBottom: 15,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  groupAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4c669f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupAvatar: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  createdBy: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    marginTop: 10,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GroupListScreen;