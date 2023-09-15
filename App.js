import React, { useState, useRef, useMemo, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, Image, TouchableOpacity, Animated, TouchableWithoutFeedback, Share, Keyboard, ActivityIndicator, ScrollView, RefreshControl, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar} from 'expo-status-bar';
import { NavigationContainer, useNavigation, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Ionicons, MaterialCommunityIcons, FontAwesome5} from '@expo/vector-icons';
import Reviews from './Reviews';
import MyProfile from './MyProfile';
import OtherProfile from './OtherProfile';
import Friends from './Friends';
import Top from './Top';
import Chat from './Chat';
import Preferences from './Preferences';
import Watchlist from './Watchlist';
import Community from './Community';
import Post from './Post';
import Daily from './Daily';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lighten, darken } from 'polished';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import moment from 'moment';
import 'moment-timezone';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


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

export default function App() {
  const Stack = createNativeStackNavigator();

  return (
    <BottomSheetModalProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Reviews" component={Reviews} />
          <Stack.Screen name="MyProfile" component={MyProfile} />
          <Stack.Screen name="Friends" component={Friends} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="Top" component={Top} />
          <Stack.Screen name="Preferences" component={Preferences} />
          <Stack.Screen name="Watchlist" component={Watchlist} />
          <Stack.Screen name="Community" component={Community} />
          <Stack.Screen name="Post" component={Post} />
          <Stack.Screen name="OtherProfile" component={OtherProfile} />
          <Stack.Screen name="Daily" component={Daily} />
        </Stack.Navigator>
      </NavigationContainer>
    </BottomSheetModalProvider>
  );
} 

function HomeScreen() {
  const navigation = useNavigation();
  const BottomSheetModalRef = useRef(null);
  const snapPoints = ['53'];
  const [shareRatings, setShareRatings] = useState(false);
  const [shareWithFriends, setShareWithFriends] = useState(false);
  const [dailyNotif, setDailyNotif] = useState(false);
  const [reviewNotif, setReviewNotif] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [isPosterTapped, setPosterTapped] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [isFinalScreen, setisFinalScreen] = useState(false);
  const [isGuessCorrect, setisGuessCorrect] = useState(false);
  const [watchlist, setWatchlist] = useState(false);
  const [frameSrc, setFrameSrc] = useState(null);
  const [posterSrc, setPosterSrc] = useState(null);
  const buttonIndices = Array.from({ length: currentMovieIndex + 1}, (_, index) => index + 1);
  const [rating, setRating] = useState(0);
  const [userID, setUserID] = useState(null);
  const [userName, setUserName] = useState(null);
  const [title, setTitle] = useState(null);
  const [director, setDirector] = useState(null);
  const [frame1, setFrame1] = useState(null);
  const [frame2, setFrame2] = useState(null);
  const [frame3, setFrame3] = useState(null);
  const [frame4, setFrame4] = useState(null);
  const [frame5, setFrame5] = useState(null);
  const [pegi, setPegi] = useState(null);
  const [length, setLength] = useState(null);
  const [genre, setGenre] = useState(null);
  const [searchString, setSearchString] = useState(null);
  const [movieSuggestions, setMovieSuggestions] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');
  const [wrongGuess, setWrongGuess] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [usedDate, setUsedDate] = useState(null);
  const [longAR, setLongAR] = useState(false);
  const [streak, setStreak] = useState(null)
  const [postTitle, setPostTitle] = useState(null)
  const [isLoadingReview, setIsLoadingReview] = useState(true);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingDaily, setIsLoadingDaily] = useState(true);
  const [postData, setPostData] = useState({});
  const [reviewData, setReviewData] = useState({});
  const scaleRef = useRef(1);
  const isFocused = useIsFocused();
  const [isFilmChecked, setIsFilmChecked] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [ratings, setRatings] = useState([]) 
  const [userSince, setUserSince] = useState(null) 
  const [refreshing, setRefreshing] = React.useState(false);
  const [seenStatus, setSeenStatus] = useState(null)

  useEffect(() => {
    if (isFocused && !isFilmChecked) {
      setIsLoadingDaily(true);
      checkMovieStatus(title, director, pegi, length);
      AsyncStorage.getItem(`index_${title}`)
      .then((status) => {
        setSeenStatus(status);
      })
      setIsFilmChecked(true); 
    }
  }, [isFocused, isFilmChecked]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPostData();
    fetchReviewData();
    setIsLoadingDaily(true);
    checkMovieStatus(title, director, pegi, length);
    setIsFilmChecked(true);
  
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleNotificationResponse = (response) => {
    const { notification } = response;
    const { request } = notification;
    const { content } = request;
    const { data } = content;
    console.log(data);

    if (data && data.messageType === 'friendMessage') {
        const { contactUserID, myID, title } = data;

        navigation.navigate('Chat', { myID, contactUserID, friendName: title });
    }
    else if (data && data.messageType === 'reviewMessage') {
      const openLatest = true;
      navigation.navigate('Reviews', {openLatest});
    }
    else if (data && data.messageType === 'dailyMessage') {
      navigation.navigate('Daily');
    }

  };


  async function registerForPushNotificationsAsync() {
    let token;
  
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
      uploadTokenToServer(token);

    } else {
    }
  
    return token;
  }

  const uploadTokenToServer = async (token) => {
    const currentUserID = await AsyncStorage.getItem('userID');
    const preferences = await AsyncStorage.getItem('preferences');
    if (preferences) {
      const parsedPreferences = JSON.parse(preferences);

      if (parsedPreferences.dailyNotif == true) {
        try {
          const formData = new FormData();
          formData.append('userID', currentUserID); 
          formData.append('token', token);
      
          const response = await fetch('<link to upload tokens to database>', {
            method: 'POST',
            body: formData,
          });
      
          const data = await response.json();
          console.log(data); 
        } catch (error) {
          console.error('Error uploading token:', error);
        }
      }
    }
  };
  

  useEffect(() => {
    const dayOfYear = getDayOfYear(); 
    setUsedDate(dayOfYear);
    fetchMovieData(dayOfYear);
    fetchPostData();
    fetchReviewData();
    fetchAllMovies();
    setCurrentIndex(1);
    setSuggestions([]);
    setSearchString("");
    loadStreak();
    loadUserName();
    loadUserID();



    AsyncStorage.getAllKeys()
    .then((keys) => {
      const ratedFilmsKeys = keys.filter((key) => key.startsWith('rating_'));
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
        })
        .catch((error) => {
          console.error('Error retrieving ratings:', error);
        });
    })
    .catch((error) => {
      console.error('Error retrieving rated films:', error);
    });

    AsyncStorage.getItem('appOpenedDate')
    .then((firstopened) => {
      setUserSince(firstopened.substring(0, 10));
    })
    .catch((error) => {
      console.error('Error retrieving app opened date:', error);
    });
    retrievePreferences();
    updateUserInformation();
  }, []);

  const updateUserInformation = async () => {
    const userInfo = {
      userID: userID,
      userName: userName,
      ratings: ratings.map(item => ({
        title: item.title,
        posterSrcDirect: item.posterSrcDirect,
        posterSrcPath: item.posterSrcPath,
        rating: item.rating,
      })),
      userSince: userSince,
    };
    console.log(JSON.stringify(userInfo));
    if (userID != null) {
      try {
        const response = await fetch('<link to upload user info to our database (ratings, id). for friends to see>', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userInfo),
        });
    
        if (response.ok) {
          console.log('User information updated successfully.');
        } else {
          console.error('Failed to update user information.');
        }
      } catch (error) {
        console.error('Error updating user information:', error);
      }
    }
  };
  
  

  function getDayOfYear() {
    const now = moment().tz(moment.tz.guess());
    const dayOfYear = now.dayOfYear();
    return dayOfYear;
  }

  function calculateSecondsUntilMidnight() {
    const now = new Date();
    const millisecondsUntilMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 
      0, 
      0 
    ) - now;
  
    const secondsUntilMidnight = Math.floor(millisecondsUntilMidnight / 1000);
    return secondsUntilMidnight;
  }

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const reload = (date) => {
    setUsedDate(date);
    setCurrentMovieIndex(0);
    setWrongGuess(false);
    setWatchlist(false);
    setisGuessCorrect(false);
    setisFinalScreen(false);
    setCurrentIndex(1);
    setSuggestions([]);
    setSearchString("");
    fetchMovieData(date);
    fetchAllMovies();
  };

  const fetchReviewData = () => {
    fetch('<link to fetch latest review>')
    .then((response) => response.json())
    .then((data) => {
      setReviewData(data);
      setIsLoadingReview(false);
    })
    .catch((error) => {
      console.error('Error fetching review data:', error);
    });
  };

  const fetchPostData = () => {
    fetch('<link to fetch latest post>')
    .then((response) => response.json())
    .then((data) => {
      setPostData(data);
      setIsLoadingPost(false);
    })
    .catch((error) => {
      console.error('Error fetching review data:', error);
    });
  };

  

  useEffect(() => {
    const interval = setInterval(() => {
      checkDate();
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  
  checkDate = () => {
    const actualDate = getDayOfYear();
    if (usedDate !== actualDate) {
      reload(actualDate);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {

      const now = new Date();

      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999); 

      const remainingMilliseconds = midnight - now;
      const remainingSeconds = Math.floor(remainingMilliseconds / 1000) % 60;
      const remainingMinutes = Math.floor(remainingMilliseconds / 1000 / 60) % 60;
      const remainingHours = Math.floor(remainingMilliseconds / 1000 / 60 / 60);

      const formattedTime = `${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

      setRemainingTime(formattedTime);
      
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);


  const fetchAllMovies = async () => {
    const response = await fetch('<link to fetch all movie titles in the db>');
    const movieTitles = await response.json();
  
    setMovieSuggestions(movieTitles);
  };
  

  const fetchMovieData = async (dayOfYear) => {
    try {
      const response = await fetch(`<link to fetch movie of the day>`);
      const movieData = await response.json();

      setTitle(movieData.title);
      AsyncStorage.getItem(`index_${movieData.title}`)
      .then((status) => {
        console.log(status);
        setSeenStatus(status);
      })
      setDirector(movieData.director);
      setFrameSrc(movieData.frame1);
      setFrame1(movieData.frame1);
      setFrame2(movieData.frame2);
      setFrame3(movieData.frame3);
      setFrame4(movieData.frame4);
      setFrame5(movieData.frame5);
      setPosterSrc(movieData.poster);
      setPegi(movieData.pegi);
      setLength(movieData.length);
      setGenre(movieData.genre);
  
      checkMovieStatus(movieData.title, movieData.director, movieData.pegi, movieData.length);
    } catch (error) {
      console.error('Error fetching movie data:', error);
    }
  };

  const handleNextFrame = () => {
    if (currentMovieIndex < 5) {
      setCurrentMovieIndex(currentMovieIndex + 1);
      switch (currentMovieIndex) {
        case 0:
          setFrameSrc(frame2);
          setWrongGuess(true);
          setCurrentIndex(2);
          break;
        case 1:
          setFrameSrc(frame3);
          setWrongGuess(true);
          setCurrentIndex(3);
          break;
        case 2:
          setFrameSrc(frame4);
          setWrongGuess(true);
          setCurrentIndex(4);
          break;
        case 3:
            setFrameSrc(frame5);
            setWrongGuess(true);
            setCurrentIndex(5);
            break;
        case 4:
          setWrongGuess(true);
          AsyncStorage.setItem(`index_${title}`, 'Unseen');
          resetStreak();
          setisFinalScreen(true);
          break;
      }
    } else {
      AsyncStorage.setItem(`index_${title}`, 'Unseen');
      resetStreak();
      setisFinalScreen(true);
    }
  }; 

  const checkMovieStatus = async (movieTitle, movieDirector, moviePegi, movieLength) => {
    const storedMovieStatus = await AsyncStorage.getItem(`index_${movieTitle}`);
    if (storedMovieStatus == 'Unseen') {
      const watchlisted = await AsyncStorage.getItem(`watchlist_${movieTitle}_${movieDirector}_${moviePegi}_${movieLength}`);
      if (watchlisted) {
        setWatchlist(true);
      }
      setisFinalScreen(true);
    }
    else if (storedMovieStatus == 'Seen') {
      setRating(0);
      setisGuessCorrect(true);
      setisFinalScreen(true);
    }
    setIsLoadingDaily(false);
  };

  const [userGuess, setUserGuess] = useState('');
  const [isGuessSubmitted, setIsGuessSubmitted] = useState(false);

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
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  const loadStreak = async () => {
    try {
      const savedstreak = await AsyncStorage.getItem('streak');
      if (savedstreak) {
        setStreak(parseInt(savedstreak));
      }
      else {
        setStreak(0);
        AsyncStorage.setItem('streak', '0');
      };
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const handleGuessButtonPress = () => {
    handleGuess();
    setIsGuessSubmitted(true);
  };

  const handleGuess = () => {
    const currentMovie = title;
    if (searchString.toLowerCase() === currentMovie.toLowerCase()) {
      AsyncStorage.setItem(`index_${title}`, 'Seen');
      setRating(0);
      increaseStreak();
      setisGuessCorrect(true);
      setisFinalScreen(true);
    } else {
      handleNextFrame();
    }
  };
  
  const increaseStreak = () => {
    setStreak(streak + 1);
    AsyncStorage.setItem('streak', JSON.stringify(streak));
  };

  const resetStreak = () => {
    AsyncStorage.setItem('streak', '0')
  };

  const handlePresentModal = () => {
    Keyboard.dismiss();
    BottomSheetModalRef.current?.present();
  };
  const handleGoToReviews = (openLatest) => {
    BottomSheetModalRef.current?.close(); 
    navigation.navigate('Reviews', {openLatest});
  };
  const handleGoToCommunity = () => {
    BottomSheetModalRef.current?.close(); 
    navigation.navigate('Community');
  };
  const handleGoToMyProfile = (firstOpen) => {
    BottomSheetModalRef.current?.close(); 
    navigation.navigate('MyProfile', {firstOpen});
  };
  const handleGoToFriends = () => {
    BottomSheetModalRef.current?.close(); 
    navigation.navigate('Friends');
  };
  const handleGoToPreferences = () => {
    BottomSheetModalRef.current?.close();
    navigation.navigate('Preferences');
  };
  const handleGoToWatchlist = () => {
    BottomSheetModalRef.current?.close(); 
    navigation.navigate('Watchlist');
  };
  const handleGoToDaily = () => {
    BottomSheetModalRef.current?.close(); 
    setIsFilmChecked(false);
    navigation.navigate('Daily');
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      retrievePreferences();
    });
  
    return unsubscribe;
  }, [navigation]);

  const retrievePreferences = async () => {
    try {
      const preferences = await AsyncStorage.getItem('preferences');
      if (preferences !== null) {
        const parsedPreferences = JSON.parse(preferences);
        setShareRatings(parsedPreferences.shareRatings);
        setShareWithFriends(parsedPreferences.shareWithFriends);
        setDailyNotif(parsedPreferences.dailyNotif);
        setReviewNotif(parsedPreferences.reviewNotif);
        setSelectedTheme(parsedPreferences.selectedTheme);
      } else {
        setShareRatings(true);
        setShareWithFriends(true);
        setDailyNotif(true);
        setReviewNotif(true);
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

  function generateUserID() {
    const min = 1000;
    const max = 100000;
    let userID = Math.floor(Math.random() * (max - min + 1)) + min;
  
    fetch(`<link to check if php already exists>`)
      .then(response => response.text())
      .then(data => {
        if (data === "exists") {
          console.log('regenerating...')
          userID = generateUserID();
        }
        else {
          console.log(`userID generated: ${userID}`)
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    
    return userID;
  }
  
  const handlePosterPress = useMemo(() => {
    return () => {
      Animated.timing(fadeAnim, {
        toValue: isPosterTapped ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      setPosterTapped(!isPosterTapped);
    };
  }, [fadeAnim, isPosterTapped]);

  const renderPosterDescription = () => {
    if (isPosterTapped) {
      return (
        <Animated.View
          style={[
            styles.posterDescription,
            {
              opacity: fadeAnim,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            },
          ]}
        >
          <Text style={styles.posterDescriptionText}>
            {director}{'\n'}{'\n'}
            {pegi}{'\n'}{'\n'}
            {length}{'\n'}
            {genre}
          </Text>
        </Animated.View>
      );
    }
    return null;
  };

  const getRating = () => {
    AsyncStorage.getItem(`rating_${title}_${posterSrc}`).then(rating => {
      if (rating) {
        setRating(parseInt(rating));
      }
    });
  };

  const renderStars = () => {
    getRating();
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const starIcon = i < rating ? '★' : '☆';
      stars.push(
        <TouchableOpacity key={i} onPress={() => handleStarPress(i)} activeOpacity={0.7}>
          <Text style={styles.star}>{starIcon}</Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const handleGuessInputChange = (text) => {
    setSearchString(text);
    setWrongGuess(false);

    const matchedSuggestions = movieSuggestions.filter((title) =>
      title.toLowerCase().includes(text.toLowerCase()),
    );
  
    const sortedSuggestions = matchedSuggestions.sort((a, b) => {
      if (a.length < b.length) return 1;
      if (a.length > b.length) return -1;
      return 0;
    });
  
    setSuggestions(sortedSuggestions.slice(0, 3));
  
    setUserGuess(text);
  };

  const calculateTimeAgo = (time) => {
    const currentTime = new Date();
    const targetTime = new Date(time);
  
    const timeDifference = currentTime - targetTime;
  
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(weeks / 4);
  
    if (seconds < 60) {
      return `now`;
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7){
      return `${days}d ago`;
    } else if (weeks < 4){
      return `${weeks}w ago`;
    } else {
      return `${months}m ago`;
    }
  };

  const handleStarPress = (starIndex) => {
    const ratingValue = starIndex + 1;
    setRating(ratingValue);
  
    const ratingData = {
      id: userID,
      name: userName || `user${userID}`,
      day: getDayOfYear(),
      title: title,
      rating: ratingValue,
    };
  
    fetch('<link to upload rating>', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratingData),
    })
      .then(response => response.text())
      .then(data => {
        console.log('Rating submitted successfully:', data);
        AsyncStorage.setItem(`rating_${title}_${posterSrc}`, ratingValue.toString());
      })
      .then(() => {
        fetch('<link to uppdate activity>', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ratingData),
        })
          .then(response => response.text())
          .then(data => {
            console.log('Activity updated successfully:', data);
            console.log(ratingData);
          })
          .catch(error => {
            console.log('Error updating activity:', error);
          });
      })
      .catch(error => {
        console.log('Error submitting rating:', error);
      });
  };

  const handleShare = () => {
    if (isGuessCorrect) {
      try {
        if (rating == 0) {
          if (streak > 1) {
            Share.share({
              message: `I've seen today's film on Widescreen. I'm on a streak of ${streak}!\n\nHave you seen it?\n\nhttps://bpstudios.nl/widescreen`,
            });
          }
          else {
            Share.share({
              message: `I've seen today's film on Widescreen.\n\nHave you seen it?\n\nhttps://bpstudios.nl/widescreen`,
            });
          }
        }
        else {
          if (streak > 1) {
            Share.share({
              message: `I gave today's film on Widescreen a ${rating}/5. I'm on a streak of ${streak}!\n\nHave you seen it?\n\nhttps://bpstudios.nl/widescreen`,
            });
          }
          else {
            Share.share({
              message: `I gave today's film on Widescreen a ${rating}/5.\n\nHave you seen it?\n\nhttps://bpstudios.nl/widescreen`,
            });
          }
        }
      } catch (error) {
        console.error('Error sharing username:', error);
      }
    }
    else {
      try {
        Share.share({
          message: `I haven't seen today's film on Widescreen.\n\nHave you seen it?\n\nhttps://bpstudios.nl/widescreen`,
        });
      } catch (error) {
        console.error('Error sharing username:', error);
      }
    }
  };

  const handleButtonPress = (index) => {
    if (index === 1) {
      setCurrentIndex(1);
      setFrameSrc(frame1);
    } else if (index === 2) {
      setCurrentIndex(2);
      setFrameSrc(frame2);
    } else if (index === 3) {
      setCurrentIndex(3);
      setFrameSrc(frame3);
    } else if (index === 4) {
      setCurrentIndex(4);
      setFrameSrc(frame4);
    } else if (index === 5) {
      setCurrentIndex(5);
      setFrameSrc(frame5);
    }
  };

  const renderReviewStars = (rating) => {
    const starIcons = [];
    const isPerfectScore = rating === 5;

    for (let i = 1; i <= 5; i++) {
      const starIconName = i <= rating ? 'star' : 'star-border';
      let starIconColor;

      if (isPerfectScore) {
        starIconColor = '#92cd28';
      } else if (rating === 4) {
        starIconColor = '#86B049';
      } else if (rating === 3) {
        starIconColor = '#f8d568';
      } else if (rating === 2) {
        starIconColor = '#ffa33f';
      } else if (rating === 1) {
        starIconColor = '#f78914';
      }

      starIcons.push(
        <MaterialIcons
          name={starIconName}
          size={25}
          color={starIconColor}
          key={i}
        />
      );
    }
    return starIcons;
  };

  const postContentPreview = (postTitle, postContent) => {    
    const maxLength = 100 - postTitle.length - 5;

    postContent = postContent.replace(/[\r\n]+/g, " ");
  
    if (postContent.length > maxLength) {
      const lastSpaceIndex = postContent.lastIndexOf(" ", maxLength - 3);
      postContent = postContent.substring(0, lastSpaceIndex) + "...";
    }
  
    return postContent;
  };
  
  
  useEffect(() => {
    AsyncStorage.getItem('userID').then(userID => {
      if (!userID) {
        const userID = generateUserID();
        const currentDate = new Date().toISOString();
        AsyncStorage.setItem('appOpenedDate', currentDate);
        AsyncStorage.setItem('userID', JSON.stringify(userID));
        AsyncStorage.setItem('userName', `user${userID}`)

        const newAccountMSG = {
          id: `${userID}`,
          name: `user${userID}`,
          day: getDayOfYear(),
          title: 'their new account',
          rating: 5,
        };

        fetch('<link to update activity>', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newAccountMSG),
        })
          .then(response => response.text())
          .then(data => {
            console.log('Activity updated successfully:', data);
            console.log(newAccountMSG);
          })
          .catch(error => {
            console.log('Error updating activity:', error);
          });
        handleGoToMyProfile(true);
      }
    });
  }, []);

  return (
    <>
    <GestureHandlerRootView style={{ flex: 1 }}>
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
    <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
    <ScrollView
      style={{scrollY: 0, width: '100%'}} 
      contentContainerStyle={{ flex: 1}}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
        progressViewOffset={65}
        refreshing={refreshing} 
        onRefresh={onRefresh}
        tintColor="#000" />
      }>
      <View style={styles.pageLogoContainer}>
        <Image
          source={require('./images/tinylogo.png')}
          style={styles.pageLogo}
        />
      </View>
      <TouchableOpacity style={styles.menuButton} onPress={handlePresentModal}>
        <MaterialIcons name="menu" size={30} color="black" />
      </TouchableOpacity>
      <View style={styles.threethirdContainer}>
        
        {
          isLoadingDaily ? (
            <TouchableOpacity onPress={() => handleGoToDaily()} style={styles.todaysFilmContainer}>
              <Text style={[styles.sectionText, { backgroundColor: getContainerBackgroundColor() }]}>Today's Film</Text>
              <ActivityIndicator size="large" color="#000000" />
            </TouchableOpacity>

          ) : (
            isFinalScreen == false ? (
              <TouchableOpacity onPress={() => handleGoToDaily()} style={styles.todaysFilmContainer}>
                <Text style={[styles.sectionText, { backgroundColor: getContainerBackgroundColor() }]}>Today's Film</Text>
                <View style={[styles.frameContainer, {backgroundColor: lighten(0.03, getContainerBackgroundColor())}]}>
                    <View style={[styles.frameInfoTag, {backgroundColor: lighten(0.04, getContainerBackgroundColor())}]}>
                      <Ionicons name="help-circle-outline" size={24} color="black"/>
                    </View>
                    <Image
                      style={styles.frame}
                      source={{ uri: frame1 }}
                    />
                  </View>
                  
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => handleGoToDaily()} style={styles.todaysFilmContainer}>
                <Text style={[styles.sectionText, { backgroundColor: getContainerBackgroundColor() }]}>Today's Film</Text>
                  <View style={[styles.frameContainer , {backgroundColor: lighten(0.03, getContainerBackgroundColor())}]}>
                    <View style={[styles.frameInfoTag, {backgroundColor: lighten(0.04, getContainerBackgroundColor())}]}>
                      {seenStatus == "Seen" ?(<Ionicons name="checkmark-circle-outline" size={24} color="black"/>) : (<Ionicons name="close-circle-outline" size={24} color="black"/>)}
                    </View>
                    <Image
                      style={styles.frame}
                      source={{ uri: frame5 }}
                    />
                    
                  </View>
              </TouchableOpacity>
            ) 
          )
        }
        
        <TouchableOpacity onPress={() => handleGoToReviews(true)} style={styles.latestReviewContainer}>
          <Text style={[styles.sectionText, { backgroundColor: getContainerBackgroundColor() }]}>Latest Review</Text>
          {
            isLoadingReview ? (
              <ActivityIndicator size="large" color="#000000" />
            ) : (
              <View style={[styles.infoContainer, {backgroundColor: lighten(0.05, getContainerBackgroundColor())}]}>
              <View>
                <View style={styles.titleContainer}>
                  <Text style={styles.reviewTitle}>{reviewData.title}</Text>
                </View>
                <View style={styles.ratingContainer}>
                  <View style={styles.starIconsContainer}>{renderReviewStars(parseInt(reviewData.rating))}</View>
                </View>
              </View>
              <Image style={styles.reviewImage} source={{ uri: reviewData.imageUrl }} />
            </View>
            )
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleGoToCommunity()}  style={styles.communityContainer}>
          <Text style={[styles.sectionText, { backgroundColor: getContainerBackgroundColor() }]}>Latest Post</Text>
          {
            isLoadingPost ? (
              <ActivityIndicator size="large" color="#000000" />
            ) : (
              <View style={[styles.postContainer, {backgroundColor: lighten(0.05, getContainerBackgroundColor())} ]}>
                <View style={styles.creditsContainer}>
                  <Text style={styles.creditsDateText}>{calculateTimeAgo(postData.postDate)}</Text>
                  <Image source={{ uri: `<link to get pfp by ID>`}} style={styles.creditsPfp}/>
                  <Text style={styles.creditsText}>{postData.creatorName} posted:</Text>
                </View>
                <Text style={styles.postTitle}>{postData.postTitle}</Text>
                <Text style={styles.postContent}>{postContentPreview(postData.postTitle, postData.postContent)}</Text>
              </View>
            )
          }
        </TouchableOpacity>
      </View>
      </ScrollView>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={BottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backgroundStyle={{
              borderRadius: 30,
              backgroundColor: lighten(0.05, getContainerBackgroundColor()), 
            }}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity onPress={handleGoToDaily} style={styles.menuOption}>
                <FontAwesome5 name="calendar-day" size={20} color="black" style={{ marginBottom: 4 }}/>
                <Text style={styles.menuOptionText}>Today's film</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleGoToReviews(false)}  style={styles.menuOption}>
                <Ionicons name="newspaper" size={20} color="black" style={{ marginBottom: 3 }}/>
                <Text style={styles.menuOptionText}>Reviews</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGoToCommunity} style={styles.menuOption}>
                <Ionicons name="planet" size={20} color="black" style={{ marginBottom: 3 }}/>
                <Text style={styles.menuOptionText}>Community</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGoToWatchlist} style={styles.menuOption}>
                <Ionicons name="bookmark" size={20} color="black" style={{ marginBottom: 3}} />
                <Text style={styles.menuOptionText}>Watchlist</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGoToFriends} style={styles.menuOption}>
                <Ionicons name="people" size={20} color="black" style={{ marginBottom: 3 }}/>
                <Text style={styles.menuOptionText}>Friends</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleGoToMyProfile(false)} style={styles.menuOption}>
                <Ionicons name="person" size={20} color="black" style={{ marginBottom: 3 }} />
                <Text style={styles.menuOptionText}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGoToPreferences} style={styles.menuOption}>
                <MaterialIcons name="settings" size={20} color="black" style={{ marginBottom: 3 }}/>
                <Text style={styles.menuOptionText}>Preferences</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetModal>
        </BottomSheetModalProvider>
    </View>
    </TouchableWithoutFeedback>
    </GestureHandlerRootView>
    <StatusBar style="dark" />
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeedd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threethirdContainer: {
    marginTop: 110,
    width: '100%',
    flex: 1,
  },
  sectionText: {
    position: 'absolute',
    left: 20,
    top: -14, 
    fontFamily: font1,
    fontSize: 20,
    paddingHorizontal: 15
  },
  todaysFilmContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: 'rgba(0, 0, 0, 0.4)',
    borderTopWidth: 2,
    paddingHorizontal: 10,
    width: '100%',
    height: '33%',
    paddingVertical:5,
  },
  todaysFilmTextContainer: {
    width: '40%',
    marginLeft: 25,
    paddingVertical: 5,
    alignItems:'center',
    borderRadius: 8,
    justifyContent: 'center',
  },
  todaysFilmTitle: {
    fontWeight: 500,
    textAlign:'center',
    fontSize: 22,
    fontFamily: font1,
  },
  todaysFilmNext: {
    marginTop: 15,
    textAlign:'center',
    fontSize: 20,
    fontFamily: font1,
  },
  latestReviewContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: 'rgba(0, 0, 0, 0.4)',
    borderTopWidth: 2,
    width: '100%',
    height: '32%',
  },
  communityContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: 'rgba(0, 0, 0, 0.4)',
    borderTopWidth: 2,
    width: '100%',
    height: '35%',
  },
  menuButton: {
    marginTop: 10,
    position: 'absolute',
    top: 30,
    right: 15,
    padding: 10,
  },
  pageTitle: {
    marginTop: 10,
    position: 'absolute',
    top: 35,
    left: 15,
    padding: 10,
    fontSize: 25,
    fontFamily: font1,
  },
  pageLogoContainer: {
    marginTop: 10,
    position: 'absolute',
    top: 32,
    left: 30,
    borderRadius:5,
  },
  pageLogo: {
    height:40,
    width: 40,
  },
  frameContainer: {
    width: '95%',
    backgroundColor: 'red',
    justifyContent: 'center',
    borderRadius: 4,
    alignItems: 'center',
    padding: 4
  },
  frameInfoTag: {
    zIndex: 10,
    top: 0,
    left: 20,
    width: 55,
    height: 35,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center'
  },
  frameInfoTagText: {
    textAlign: 'center',
    fontFamily: font1,
    fontSize: 18
  },
  frame: {
    position: 'relative',
    width: '100%',
    height: '80%',
    resizeMode: 'cover',
    borderRadius: 4,
    overflow: 'hidden',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 35,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  menuOptionText: {
    marginLeft: 10,
    fontSize: 22,
    fontFamily: font1,
    marginBottom: 4,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 500,
    fontFamily: font1,
    marginRight: 10,
  },  
  reviewImage: {
    width: 110,
    height: 110,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'grey',
    backgroundColor: '#eeeedd',
  },
  titleContainer: {
    height: 65,
    width: 190,
    textAlignVertical: 'center',
    justifyContent: 'center',
  },
  postContainer: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 22,
    marginBottom: 5,
    borderRadius: 8,
  },
  infoContainer: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIconsContainer: {
    borderTopWidth: 1,
    width: 165,
    marginTop: 5,
    paddingTop: 10,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    flexDirection: 'row',
  },
  creditsText: {
    fontSize: 16,
    fontFamily: font1
  },
  creditsDateText: {
    fontSize: 16,
    fontFamily: font1,
    color: 'rgba(0, 0, 0, 0.75)',
  },
  creditsPfp: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor:'rgba(0, 0, 0, 0.2)',
    marginLeft: 25,
    marginRight: 7,
    marginBottom: 2,
    borderRadius: 10,
    backgroundColor: '#EEEEDD'
  },
  creditsContainer: {
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  postTitle: {
    textAlign: 'center',
    fontSize: 18,
    paddingHorizontal: 12,
    fontFamily: font1,
    fontWeight: 'bold',
    marginTop: 10,
  },
  postContent: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 18,
    fontFamily: font1,
    color: 'rgba(0, 0, 0, 0.75)',
  },
});