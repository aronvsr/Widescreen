import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { AntDesign, Ionicons, Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lighten } from 'polished';
import { Platform } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import moment from 'moment';
import 'moment-timezone';
import Chat from './Chat';

let font1 = '';
if (Platform.OS === 'ios') {
  font1 = 'Baskerville';
} else if (Platform.OS === 'android') {
  font1 = Platform.select({
    android: 'sans-serif', 
    default: 'default font', 
  });
} else {
  font1 = 'default font'; 
}

function Friends({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendId, setFriendId] = useState('');
  const [myID, setMyID] = useState(null);
  const [showAddFriendMenu, setShowAddFriendMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [readStatuses, setReadStatuses] = useState({});
  const [readStatusesFetched, setReadStatusesFetched] = useState(false);

  const checkReadStatus = async (myID, contactUserID) => {
    const url = `<link to check read status>`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const { myStatus, contactStatus } = data;
        return myStatus;
      } else {
        console.error('Failed to fetch status data. Status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error checking status:', error);
      return null;
    }
  };

  useEffect(() => {
    retrievePreferences();
  }, []);
  
  useEffect(() => {
    if (myID) {
      fetchFriendsData();
      fetchUnknownFollowers();
    }
  }, [myID]);
  
  useEffect(() => {
    if (friends.length > 0) {
      fetchReadStatuses();
    }
  }, [friends]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchReadStatuses();
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [friends]);

  const fetchReadStatuses = async () => {
    const statuses = {};
    for (const friend of friends) {
      const status = await checkReadStatus(myID, friend.id);
      statuses[friend.id] = status;
    }
    setReadStatuses(statuses);
    setReadStatusesFetched(true); 
  };

  const fetchFriendsData = async () => {
    setIsLoading(true);
    try {
      const friendIDs = await AsyncStorage.getItem('friendIDs');
      const parsedFriendIDs = friendIDs ? JSON.parse(friendIDs) : [];
  
      const requestData = {
        userID: myID,
        friendIDs: parsedFriendIDs,
      };
  
      const response = await fetch('<link to fetch activity>', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
  
      if (response.ok) {
        const activityData = await response.json();
        setFriends(activityData);
      } else {
        console.error('Failed to fetch activity data. Status:', response.status);
        const errorText = await response.text();
        console.error('Error:', errorText);
      }
    } catch (error) {
      console.error('Error fetching friends data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFriendRequests = ({ item }) => {
    return (
    <View style={styles.requestAndAddContainer}>
      <View style={{
        ...styles.requestContainer,
        backgroundColor: lighten(0.05, getContainerBackgroundColor()),
      }}>
        <View style={styles.requestInfo}>
          <Image
            style={styles.pfpSmall}
            source={{ uri: `<link to get pfp>` }}
          />
          <Text style={styles.requestText}>ID: {item}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() =>handleAcceptRequest(JSON.stringify(item))}style={{
        ...styles.addContainer,
        backgroundColor: lighten(0.05, getContainerBackgroundColor()),
      }}>
        <Ionicons
          name={'add'}
          size={30}
          color="black"
        />
      </TouchableOpacity>
    </View>
    );
  };

  const fetchUnknownFollowers = async () => {
    try {
      const friendIDs = await AsyncStorage.getItem('friendIDs');
      const parsedFriendIDs = friendIDs ? JSON.parse(friendIDs) : [];
  
      const requestData = {
        userID: myID,
        friendIDs: parsedFriendIDs,
      };
  
      const response = await fetch('<link to fetch friend requests>', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
  
      if (response.ok) {
        const unknownFollowers = await response.json();
        setFriendRequests(unknownFollowers);
      } else {
        console.error('Failed to fetch unknown followers data. Status:', response.status);
        const errorText = await response.text();
        console.error('Error:', errorText);
      }
    } catch (error) {
      console.error('Error fetching unknown followers data:', error);
    }
  };
  
  const handleAcceptRequest = (text) => {
    setFriendId(text);
  };

  const handleFriendIdChange = (text) => {
    setFriendId(text);
  };

  const handleAddFriendPress = async () => {
    const updatedFriendIDs = [...friends.map((friend) => friend.id), friendId];
    await AsyncStorage.setItem('friendIDs', JSON.stringify(updatedFriendIDs));

    setFriendId('');

    fetchFriendsData();
    fetchUnknownFollowers();
    setShowAddFriendMenu(!showAddFriendMenu);
  };

  const handleDeleteFriend = async (friendId) => {
    const updatedFriendIDs = friends.map((friend) => friend.id).filter((id) => id !== friendId);
    await AsyncStorage.setItem('friendIDs', JSON.stringify(updatedFriendIDs));

    fetchFriendsData();
  };

  const handleGoToChat = (contactUserID, friendName) => {
    navigation.navigate('Chat', { contactUserID, myID, friendName });
  };

  function getDayOfYear() {
    const now = moment().tz(moment.tz.guess());
    const dayOfYear = now.dayOfYear();
    return dayOfYear;
  }

  const handleRevealAddFriendMenu = () => {
    setShowAddFriendMenu(!showAddFriendMenu);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const retrievePreferences = async () => {
    try {
      const savedUserID = await AsyncStorage.getItem('userID');
      if (savedUserID !== null) {
        setMyID(savedUserID);
      }
    } catch (error) {
      console.log('Error retrieving preferences:', error);
    }
    try {
      const preferences = await AsyncStorage.getItem('preferences');
      if (preferences !== null) {
        const parsedPreferences = JSON.parse(preferences);
        setSelectedTheme(parsedPreferences.selectedTheme);
      } else {
        setSelectedTheme('Theme1');
      }
    } catch (error) {
      console.log('Error retrieving preferences:', error);
    }
  };

  const getContainerBackgroundColor = () => {
    switch (selectedTheme) {
      case 'Theme1':
        return '#eeeedd';
      case 'Theme2':
        return '#eed7a1';
      case 'Theme3':
        return '#FFD1DA';
      case 'Theme4':
        return '#DAF5FF';
      default:
        return '#eeeedd';
    }
  };

  const renderTag = () => {
    return (
      <View style={styles.statusBar}>
        <Octicons style={styles.DEVIcon} name="north-star" size={18} color="blue" />
        <Text style={styles.DEVText}>DEV</Text>
      </View>
    );
  };

  const compareReadStatus = (a, b) => {
    if (readStatuses[b.id] === 'unread' && readStatuses[a.id] !== 'unread') {
      return 1;
    } else if (readStatuses[a.id] === 'unread' && readStatuses[b.id] !== 'unread') {
      return -1;
    } else {
      return 0;
    }
  };

  const sortedFriends = friends.slice().sort(compareReadStatus);

  return (
    <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
      <TouchableOpacity style={styles.revealAddFriendMenu} onPress={() => handleRevealAddFriendMenu()}>
        <Ionicons
          name={showAddFriendMenu ? 'person-add' : 'person-add-outline'}
          size={30}
          color="black"
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Friends</Text>

      {showAddFriendMenu && (
        <View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={friendId}
              onChangeText={handleFriendIdChange}
              placeholder="Enter friend ID"
              placeholderTextColor={'rgba(0, 0, 0, 0.3)'}
            />
            <TouchableOpacity style={styles.addButton} onPress={() => handleAddFriendPress()}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.friendRequestsContainer}>
            <Text style={styles.friendRequestsContainerText}>Friend Requests:</Text>
          {
            friendRequests.length === 0 ? (
              <View style={styles.noRequestsContainer}>
                <Text style={styles.noRequestsText}>You have no friend requests ):</Text>
              </View>
            ) : (
              <FlatList
              data={friendRequests}
              renderItem={renderFriendRequests}
              keyExtractor={(item, index) => index.toString()}
              />
            )
          }
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {sortedFriends.length === 0 ? (
            <View style={styles.noFriendsContainer}>
              <Image
                source={require('./images/nofriends.png')}
                style={styles.noFriendsImage}
              />
              <Text style={styles.noFriendsText}>You have no friends yet.</Text>
            </View>
          ) : (
            sortedFriends.map((friend) => {
              const daysAgo = getDayOfYear() - friend.day;
              let dayText = `${daysAgo} days ago.`;

              if (daysAgo === 0) {
                dayText = 'Today';
              } else if (daysAgo === 1) {
                dayText = 'Yesterday';
              }
              return (
                <TouchableOpacity
                  onPress={() => handleGoToChat(friend.id, friend.name)}
                  key={friend.id}
                  style={{
                    ...styles.friendContainer,
                    backgroundColor: lighten(0.05, getContainerBackgroundColor()),
                  }}
                >
                  <View style={styles.friendInfoContainer}>
                    <View style={styles.pfpContainer}>
                      <Image
                        style={styles.pfp}
                        source={{ uri: `<link to fetch pfp>` }}
                      />
                      {readStatuses[friend.id] === 'unread' && (
                        <View style={styles.redDot} />
                      )}
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.friendNameContainer}>
                        <Text style={styles.friendName}>{friend.name}</Text>
                        {friend.id === '52079' ? (
                          renderTag()
                        ) :
                          null
                        }
                      </View>
                      {friend.day < getDayOfYear() || friend.title === 'their new account' ? (
                        <Text style={styles.friendActivity}>
                          Gave {friend.title} a {friend.rating}/5!
                        </Text>
                      ) : (
                        <Text style={styles.friendActivity}>
                          Gave today's film a {friend.rating}/5!
                        </Text>
                      )}
                      <Text style={styles.friendDate}>{dayText}</Text>
                    </View>
                  </View>
                  {showAddFriendMenu && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteFriend(friend.id)}
                    >
                      <Text style={styles.deleteText}>Remove friend</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeedd',
    alignItems: 'center',
  },
  revealAddFriendMenu: {
    position: 'absolute',
    top: 45,
    right: 15,
    padding: 10,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 15,
    padding: 10,
  },
  pageTitle: {
    fontSize: 25,
    marginTop: 60,
    marginBottom: 20,
    fontFamily: font1,
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  friendContainer: {
    width: 340,
    backgroundColor: '#fafaf0',
    borderRadius: 8,
    marginHorizontal: 14,
    padding: 12,
    marginBottom: 12,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: font1,
  },
  friendActivity: {
    marginTop: 5,
    fontSize: 18,
    fontFamily: font1,
  },
  friendDate: {
    marginTop: 5,
    fontSize: 15,
    fontFamily: font1,
    color: 'grey',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    marginTop: 5,
    fontSize: 16,
    color: 'red',
    fontFamily: font1,
  },
  input: {
    width: 200,
    height: 40,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 15,
    backgroundColor: '#eeeedd',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteText: {
    fontFamily: font1,
    fontSize: 16,
  },
  noFriendsContainer: {
    alignItems: 'center',
  },
  noFriendsImage: {
    marginTop: 100,
    width: 200,
    height: 200,
    marginBottom: -20,
  },
  noFriendsText: {
    fontSize: 18,
    fontFamily: font1,
  },
  friendInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pfp: {
    height: 70,
    width: 70,
    borderRadius: 35,
    borderWidth: 1,
    backgroundColor: '#eeeedd',
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  pfpSmall: {
    marginRight: 10,
    height: 30,
    width: 30,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: '#eeeedd',
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  pfpContainer: {
    justifyContent: 'center',
    marginRight: 15,
  },
  textContainer: {
    justifyContent: 'center',
    width: 205,
  },
  DEVIcon: {
  },
  friendNameContainer: {
    flexDirection: 'row',
  },
  DEVText: {
    fontSize: 16,
    marginLeft: 3,
    fontFamily: font1,
  },
  statusBar: {
    marginTop: 1,
    marginLeft: 70,
    flexDirection: 'row',
  },
  blueDot: {
    left: 0,
    top: 5,
    position: 'absolute',
    width: 15,
    height: 15,
  },
  redDot: {
    top: 2,
    right: 2,
    position: 'absolute',
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 9,
    backgroundColor: '#dc142c',
  },
  friendRequestsContainer: {
    paddingTop: 5,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  requestContainer:{
    paddingHorizontal: 10,
    justifyContent: 'center',
    height: 40,
    width: 160,
    borderRadius: 8,
    marginBottom: 6,
  },
  requestInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  requestAndAddContainer: {
    flexDirection: 'row',
  },
  addContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    marginLeft: 5,
    borderRadius: 8,
  },
  noRequestsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: 220,
    height: 60,
  },
  noRequestsText: {
    fontFamily: font1,
    fontSize: 16,
  },
  friendRequestsContainerText: {
    fontFamily: font1,
    fontSize: 18,
    marginBottom: 10,
    marginTop: 6,
  },
  requestText: {
    fontFamily: font1,
    fontSize: 18,
  },
  loadingContainer: {
    marginTop: 100,
  },
});

export default Friends;
