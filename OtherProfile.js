import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { darken } from 'polished';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';

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

function OtherProfile({ navigation, route }) {
  const { userID, userName } = route.params;
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [friendIDs, setFriendIDs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAscending, setIsAscending] = useState(false);
  const [userDate, setUserDate] = useState(" ");
  const [userInfo, setUserInfo] = useState(null);
  const [myID, setMyID] = useState(null);

  const PosterItem = ({ title, posterSrcDirect, posterSrcPath, rating }) => (
    <View style={styles.posterItem}>
      <Image source={{ uri: posterSrcDirect + '_' + posterSrcPath }} style={styles.posterImage} />
      <Text style={styles.posterRating}>{rating}/5</Text>
    </View>
  );

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`<url to fetch user info>`);
        const data = await response.json();
  
        // Check if data is not undefined and has the expected properties
        if (data && data.userName) {
          setUserInfo(data);
        }
      } catch (error) {
        console.error('Error fetching user information:', error);
      }
    };
  
    const retrieveData = async () => {
      await fetchUserInfo();
      await retrievePreferences();
      await retrieveFriendIDs();
    };
  
    retrieveData();
  }, []);

  const sortedRatings = useMemo(() => {
    if (userInfo != null) {
      const sorted = [...userInfo.ratings];
      sorted.sort((a, b) => (isAscending ? a.rating - b.rating : b.rating - a.rating));
      return sorted;
    } else {
      return null;
    }
  }, [isAscending, userInfo]);

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

  function getDayOfYear() {
    const now = moment().tz(moment.tz.guess());
    const dayOfYear = now.dayOfYear();
    return dayOfYear;
  }

  const handleGoToChat = (contactUserID, friendName) => {
    if (myID != null) {
      navigation.navigate('Chat', { contactUserID, myID, friendName });
    }
  };

  const retrieveFriendIDs = async () => {
    try {
      const friendIDs = await AsyncStorage.getItem('friendIDs');
      const parsedFriendIDs = friendIDs ? JSON.parse(friendIDs) : [];
      setFriendIDs(parsedFriendIDs);

      const isFriend = parsedFriendIDs.includes(userID);
      setIsFriend(isFriend);
    } catch (error) {
      console.error('Error retrieving friend IDs:', error);
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

  const handleToggleOrder = () => {
    setIsAscending(!isAscending);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleAddFriendPress = async () => {
    try {
      const friendIDs = await AsyncStorage.getItem('friendIDs');
      const parsedFriendIDs = friendIDs ? JSON.parse(friendIDs) : [];
      
      const isFriend = parsedFriendIDs.includes(userID);

      if (isFriend) {
        const updatedFriendIDs = parsedFriendIDs.filter((id) => id !== userID);
        await AsyncStorage.setItem('friendIDs', JSON.stringify(updatedFriendIDs));
        setFriendIDs(updatedFriendIDs);
        setIsFriend(false);
      } else {
        const updatedFriendIDs = [...parsedFriendIDs, userID];
        await AsyncStorage.setItem('friendIDs', JSON.stringify(updatedFriendIDs));
        setFriendIDs(updatedFriendIDs);
        setIsFriend(true);
      }
    } catch (error) {
      console.error('Error handling add friend press:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>{userInfo != null ? userInfo.userName : userName}</Text>
      <View>
        <Image source={{ uri: `https://bpstudios.nl/widescreen_backend/friends/pfps/${userID}.jpg` }} style={styles.profilePicture} />
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statWrapper}>
          <Text style={styles.statsTitle}>User ID:</Text>
          <Text style={styles.statsText}>{userID}</Text>
        </View>
        <View style={styles.statWrapper}>
          <Text style={styles.statsTitle}>User since:</Text>
          <Text style={styles.statsText}>{userInfo ? userInfo.userSince : "hidden"}</Text>
        </View>
      </View>
      <View style={styles.listTitleWrapper}>
        <Text style={styles.statsText}>Their ratings:</Text>
        <TouchableOpacity onPress={handleToggleOrder}>
          <Text>
            {isAscending ? <MaterialCommunityIcons name="sort-descending" size={20} /> : <MaterialCommunityIcons name="sort-ascending" size={20} />}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        {sortedRatings !== null && sortedRatings.length > 0 ? (
          <ScrollView horizontal contentContainerStyle={styles.posterList}>
            {sortedRatings.map((rating, index) => (
              <PosterItem
                key={index}
                title={rating.title}
                posterSrcDirect={rating.posterSrcDirect}
                posterSrcPath={rating.posterSrcPath}
                rating={rating.rating}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noFilmsText}>User doesn't share ratings</Text>
        )}
      </View>
      <View style={{flexDirection: 'row'}}>
      <TouchableOpacity
        onPress={() => handleAddFriendPress()}
        style={[
          styles.addButton,
          { backgroundColor: !isFriend ? darken(0.1, getContainerBackgroundColor()) : darken(0.03, getContainerBackgroundColor()) },
        ]}
      >
        {isFriend ? (
          <View style={styles.addButtonTextContainer}>
            <Text style={styles.addButtonText}>Friend added</Text>
            <Ionicons name={'people-outline'} size={25} color="black" />
          </View>
        ) : (
          <View style={styles.addButtonTextContainer}>
            <Text style={styles.addButtonText}>Add friend</Text>
            <Ionicons name={'person-add-outline'} size={25} color="black" />
          </View>
        )}
      </TouchableOpacity>
      {userInfo != null ? (      
      <TouchableOpacity
        onPress={() => handleGoToChat(userID, userInfo.userName)}
        style={[
          styles.addButton,
          { marginLeft: 15, backgroundColor: !isFriend ? darken(0.1, getContainerBackgroundColor()) : darken(0.03, getContainerBackgroundColor()) },
        ]}
      >
        <Ionicons name={'chatbubbles-outline'} size={25} color="black" />
      </TouchableOpacity>
      ) : (      
      <TouchableOpacity
        onPress={() => handleGoToChat(userID, userName)}
        style={[
          styles.addButton,
          { marginLeft: 15, backgroundColor: !isFriend ? darken(0.1, getContainerBackgroundColor()) : darken(0.03, getContainerBackgroundColor()) },
          
        ]}
      >
        <Ionicons name={'chatbubbles-outline'} size={25} color="black" />
      </TouchableOpacity>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeedd',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 15,
    padding: 10,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '500',
    marginTop: 60,
    marginBottom: 20,
    fontFamily: font1,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    marginTop: 10,
    marginBottom: 20,
  },
  userName: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    fontFamily: font1,
  },
  editNameInput: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    fontFamily: font1,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  statsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  listTitleWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 5,
    width: 250,
    alignItems: 'center',
  },
  statWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingBottom: 5,
    width: 250,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 20,
    fontFamily: font1,
  },
  statsText: {
    fontSize: 20,
    fontFamily: font1,
    textAlign: 'center',
  },
  shareButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginBottom: 10,
    width: 200,
  },
  listContainer: {
    width: 265,
    height: 160,
  },
  starsContainer: {
    flexDirection: 'row',
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    marginTop: 5,
    justifyContent: 'center',
    width: 190,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  loadingSequence: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    position: 'absolute',
    zIndex: 10, 
  },
  posterRating: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: font1,
  },
  noFilmsText: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: font1,
  },
  uploadedMessage: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: font1,
  },
  star: {
    opacity: 0.8,
    fontSize: 22,
    marginRight: 3,
  },
  addButton: {
    marginTop: 30, 
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.6)',
  },
  addButtonText: {
    fontFamily: font1,
    fontSize: 20,
    marginRight: 10,
  },
  addButtonTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  posterRating: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: font1,
  },
  noFilmsText: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: font1,
  },
  posterTitle: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: font1,
  },
  listContainer: {
    width: 265,
    height: 160,
  },
  posterList: {
    marginRight: 20,
    flexDirection: 'row',
    marginTop: 10,
  },
  posterItem: {
    marginRight: 10,
    alignItems: 'center',
  },
  posterImage: {
    width: 80,
    height: 115,
    borderRadius: 5,
    backgroundColor: '#eeeedd',
  },
});

export default OtherProfile;
