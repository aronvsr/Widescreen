import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Share, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

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

function MyProfile({ navigation, route }) {
  const { firstOpen } = route.params;
  const [userName, setUserName] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [randomKey, setRandomKey] = useState(Math.random().toString());
  const [isEditingName, setIsEditingName] = useState(false);
  const [userSince, setUserSince] = useState('???');
  const [ratedMoviesCount, setRatedMoviesCount] = useState(0);
  const [userID, setUserID] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [watchlistCount, setWatchlistCount] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [uploadedNewPic, setUploadedNewPic] = useState(false);
  const [isAscending, setIsAscending] = useState(false); 

  useEffect(() => {
    retrievePreferences();
    loadUserName();
    loadUserID();
    AsyncStorage.getAllKeys()
      .then((keys) => {
        const ratedFilmsKeys = keys.filter((key) => key.startsWith('rating_'));
        setRatedMoviesCount(ratedFilmsKeys.length);

        const fetchRatings = ratedFilmsKeys.map(async (key) => {
          const ratingValue = await AsyncStorage.getItem(key);
          const [, title, posterSrcDirect, posterSrcPath] = key.split('_');
          return {
            title,
            posterSrcDirect,
            posterSrcPath,
            rating: parseInt(ratingValue),
          };
        });

        Promise.all(fetchRatings)
          .then((ratings) => {
            setRatings(ratings);
            console.log(ratings)
          })
          .catch((error) => {
            console.error('Error retrieving ratings:', error);
          });
      })
      .catch((error) => {
        console.error('Error retrieving rated films:', error);
      });

    AsyncStorage.getAllKeys()
      .then((keys) => {
        const watchlistKeys = keys.filter((key) => key.startsWith('watchlist_'));
        setWatchlistCount(watchlistKeys.length);
      })
      .catch((error) => {
        console.error('Error retrieving rated films:', error);
      });

    AsyncStorage.getItem('appOpenedDate')
      .then((firstopened) => {
        console.log(firstopened)
        setUserSince(firstopened ? firstopened.substring(0, 10) : '???');
      })
      .catch((error) => {
        console.error('Error retrieving app opened date:', error);
        setUserSince('???');
      });
  }, []);

  useEffect(() => {
    if (userID) {
      loadProfilePicture();
    }
  }, [userID]);

  const loadProfilePicture = async () => {
    try {
      if (!userID) {
        return;
      }

      const directory = `${FileSystem.documentDirectory}pfps/`;
      const fileName = `${userID}.jpg`;
      const path = `${directory}${fileName}`;

      const fileExists = await FileSystem.getInfoAsync(path);
      if (fileExists.exists) {
        setProfilePicture(path);
      } else {
        setProfilePicture(null);
      }
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  };

  const retrievePreferences = async () => {
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

  const loadUserID = async () => {
    try {
      const storedUserID = await AsyncStorage.getItem('userID');
      if (storedUserID) {
        setUserID(storedUserID);
      }
    } catch (error) {
      console.error('Error loading userID:', error);
    }
  };

  const loadUserName = async () => {
    try {
      const storedUserName = await AsyncStorage.getItem('userName');
      if (storedUserName) {
        setUserName(storedUserName);
      } else {
        generateUniqueName();
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  const generateUniqueName = () => {
    const uniqueName = `User${Math.random().toString(36).substr(2, 9)}`;
    setUserName(uniqueName);
    saveUserName();
  };

  const saveUserName = async () => {
    try {
      await AsyncStorage.setItem('userName', userName);

      const response = await fetch(
        '<link to update name>' +
          userID +
          '&newName=' +
          userName
      );
      const result = await response.text();

      console.log(result); 
    } catch (error) {
      console.error('Error saving username:', error);
    }
  };
  
  const handleToggleOrder = () => {
    setIsAscending(!isAscending);
  };

  const handleUploadProfilePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        alert('Permission to access the camera roll is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync();
      if (pickerResult.canceled) {
        return;
      }
      
      const selectedAsset = pickerResult.assets[0];
      const extension = selectedAsset.uri.split('.').pop();
      const fileName = `${userID}.jpg`;

      const directory = `${FileSystem.documentDirectory}pfps/`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

      const newPath = `${directory}${fileName}`;

      if (extension !== 'jpg') {
        const options = { format: 'jpeg', compress: 0.8 };
        await FileSystem.copyAsync({
          from: selectedAsset.uri,
          to: newPath,
        });
        await FileSystem.moveAsync({
          from: newPath,
          to: newPath.replace('.jpg', '.png'),
        });
        await FileSystem.moveAsync({
          from: newPath.replace('.jpg', '.png'),
          to: newPath,
        });
      } else {
        await FileSystem.copyAsync({
          from: selectedAsset.uri,
          to: newPath,
        });
      }

      setIsUploading(true);
      setUploadedNewPic(false);
      await uploadProfilePicture(newPath, fileName);
      loadProfilePicture();
      setIsUploading(false);
      setUploadedNewPic(true);
      setRandomKey(Math.random().toString());
    } catch (error) {
      console.error('Error selecting the profile picture:', error);
      setIsUploading(false);
    }
  };

  const uploadProfilePicture = async (uri, fileName) => {
    try {
      const apiUrl = '<link to upload profile picture>'; 
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg', 
      });
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.ok) {
        console.log('File uploaded successfully');
      } else {
        console.error('Error uploading file:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleNamePress = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (text) => {
    if (text.length <= 12) {
      setUserName(text);
    }
  };

  const handleNameSubmit = () => {
    setIsEditingName(false);
    saveUserName();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleShare = async () => {
    try {
      Share.share({
        message: `Add me on Widescreen, my user ID is: ${userID}\n\nhttps://bpstudios.nl/widescreen`,
      });
    } catch (error) {
      console.error('Error sharing username:', error);
    }
  };

  const PosterItem = ({ title, posterSrcDirect, posterSrcPath, rating }) => (
    <View style={styles.posterItem}>
      <Image source={{ uri: posterSrcDirect + '_' + posterSrcPath }} style={styles.posterImage} />
      <Text style={styles.posterRating}>{rating}/5</Text>
    </View>
  );

  const sortedRatings = useMemo(() => {
    const sorted = [...ratings];
    sorted.sort((a, b) => {
      if (isAscending) {
        return a.rating - b.rating;
      } else {
        return b.rating - a.rating;
      }
    });
    return sorted;
  }, [ratings, isAscending]);

  return (
    <View key={randomKey} style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
      </TouchableOpacity>
      {
        firstOpen == true ? (<Text style={styles.pageTitle}>Set a name and {"\n"} profile picture!</Text>) : (<Text style={styles.pageTitle}>My Profile</Text>)
      }
      
      <View>
        <TouchableOpacity onPress={handleUploadProfilePicture}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
          ) : (
            <Image source={require('./images/stockpfp.png')} style={styles.profilePicture} />
          )}
        </TouchableOpacity>
        {isUploading && <ActivityIndicator style={styles.loadingSequence} size="large" color="#eeeedd" />}
      </View>
      {
        uploadedNewPic == true && Platform.OS === 'android' ? (
        <Text style={styles.uploadedMessage}>Successfully updated profile picture!{'\n'}(Restart app to view changes.)</Text>
        ) :
        (null)
      }
      
      <TouchableOpacity onPress={handleNamePress}>
        {isEditingName ? (
          <TextInput
            style={styles.editNameInput}
            value={userName}
            onChangeText={handleNameChange}
            onSubmitEditing={handleNameSubmit}
            autoFocus
          />
        ) : (
          <View>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.statsContainer}>
        <View style={styles.statWrapper}>
          <Text style={styles.statsTitle}>User ID:</Text>
          <Text style={styles.statsText}>{userID}</Text>
        </View>
        <View style={styles.statWrapper}>
          <Text style={styles.statsTitle}>User since:</Text>
          <Text style={styles.statsText}>{userSince}</Text>
        </View>
      </View>
      <View style={styles.listTitleWrapper}>
        <Text style={styles.statsText}>My ratings:</Text>
        <TouchableOpacity onPress={handleToggleOrder}>
          <Text>
            {isAscending ? <MaterialCommunityIcons name="sort-descending" size={20} /> : <MaterialCommunityIcons name="sort-ascending" size={20} />}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        {sortedRatings.length === 0 ? (
          <Text style={styles.noFilmsText}>You haven't rated any films yet ) :</Text>
        ) : (
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
        )}
      </View>
      <View style={styles.shareButtonContainer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={40} color="black" style={styles.shareIcon} />
        </TouchableOpacity>
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
    marginBottom: 5,
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
  posterTitle: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: font1,
  },
  uploadedMessage: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: font1,
  }
});

export default MyProfile;
