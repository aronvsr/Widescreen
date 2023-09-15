import React, { useState, useRef, useMemo, useEffect } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, View, Image, TouchableOpacity, Animated, TouchableWithoutFeedback, Share, Keyboard, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, AntDesign} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lighten, darken } from 'polished';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ZoomableImage from './ZoomableImage';

import * as Notifications from 'expo-notifications';
import moment from 'moment';
import 'moment-timezone';



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

function Daily({ navigation }) {
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
  const [streak, setStreak] = useState(null)
  const scaleRef = useRef(1);
  const [isLoading, setIsLoading] = useState(true);

  
  

  useEffect(() => {
    const dayOfYear = getDayOfYear(); 
    setUsedDate(dayOfYear);
    fetchMovieData(dayOfYear);
    fetchAllMovies();
    setCurrentIndex(1);
    setSuggestions([]);
    setSearchString("");
    loadStreak();
    loadUserName();
    loadUserID();
    retrievePreferences();
  }, []);

  function getDayOfYear() {
    const now = moment().tz(moment.tz.guess());
    const dayOfYear = now.dayOfYear();
    return dayOfYear;
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
    const response = await fetch('<link to fetch movies for suggestions>');
    const movieTitles = await response.json();
  
    setMovieSuggestions(movieTitles);
  };
  

  const fetchMovieData = async (dayOfYear) => {
    try {
      const response = await fetch(`<link to fetch todays film>`);
      const movieData = await response.json();

      setTitle(movieData.title);
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
    setIsLoading(false);
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
  
    fetch(`<link to check if id already exists>`)
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

  const renderSuggestions = () => {
    return (
      <View style={{...styles.suggestionsContainer, zIndex: 15}}>
      {suggestions.slice(0, 3).map((suggestion, index) => (
        <TouchableOpacity 
          style={{...styles.suggestion, zIndex: 10}}
          key={index}
          onPress={() => {
            setSearchString(suggestion);
            setSuggestions([]);
          }}
        >
          <Text style={styles.suggestionText}>{suggestion}</Text>
        </TouchableOpacity>
      ))}
    </View>
    );
  };

  const renderGuessMenu = () => {
    return (
    <View keyboardShouldPersistTaps="handled" style={{zIndex: -1}}>
      <View style={styles.guessContainer}>
        <TextInput
          placeholder="Enter the movie title"
          placeholderTextColor={'rgba(0, 0, 0, 0.3)'}
          style={[
            styles.guessInput,
            wrongGuess && { borderColor: 'red'},
          ]}
          onChangeText={handleGuessInputChange}
          value={searchString}
        />
        <TouchableOpacity 
          style={styles.guessButton} 
          onPress={() => {
            handleGuessButtonPress();
            setSearchString("");
          }}
        >
          <Text style={styles.guessButtonText}>Check</Text>
        </TouchableOpacity>
      </View>
      {currentMovieIndex==4 ? (
        <Text style={styles.attemptsText}>Last attempt.</Text>
      ) : (
        <Text style={styles.attemptsText}>{5-currentMovieIndex} more attempts.</Text>
      )}
    </View>
    );
  };

  const handleWatchlistPress = () => {
    if (watchlist == false) { 
      AsyncStorage.setItem(`watchlist_${title}_${director}_${pegi}_${length}`, posterSrc);
      setWatchlist(true);
    }
    else if (watchlist == true) {
      AsyncStorage.removeItem(`watchlist_${title}_${director}_${pegi}_${length}`);
      setWatchlist(false);
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
  
    fetch('<link to send rating>', {
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
        fetch('<link to update activity>', {
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

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleGoToTop = () => {
    navigation.navigate('Top');
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
  
  useEffect(() => {
    AsyncStorage.getItem('userID').then(userID => {
      if (!userID) {
        const userID = generateUserID();
        const currentDate = new Date().toISOString();
        AsyncStorage.setItem('appOpenedDate', currentDate);
        AsyncStorage.setItem('userID', JSON.stringify(userID));
        AsyncStorage.setItem('userName', `user${userID}`)
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
    <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Today's Film</Text>
      {
        isLoading ?(
          <ActivityIndicator size="large" color="#000000" />
        ) : (
          !isFinalScreen && !isGuessSubmitted ? (
            <View style={styles.frameContainer}>
              <ZoomableImage frameSrc={frameSrc} scaleRef={scaleRef}/>
              <View style={styles.buttonContainer}>
                {buttonIndices.map((index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.indexButton,
                        index === currentIndex && styles.currentButton,
                      ]}
                      onPress={() => handleButtonPress(index)}
                    >
                    <Text style={styles.indexButtonText}>{`${index}`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {renderGuessMenu()}
              {
                searchString !== "" && suggestions && scaleRef.current == 1 && (
                  <View>
                  {renderSuggestions()}
                  </View>
                )
              }
            <View style={styles.footer}>
              <Text style={styles.footerText}>Widescreen | 2023</Text>
            </View>
          </View>
        
        ) : (
          <View style={styles.frameContainer}>
            {isFinalScreen ? (
              <>
              <TouchableOpacity style={styles.posterContainer} onPress={handlePosterPress} activeOpacity={0.7}>
                <Image style={styles.poster} source={{ uri: posterSrc}} />
                {renderPosterDescription()}
              </TouchableOpacity>
                {isGuessCorrect ? (
                  <>
                  <View style={styles.infoView}>
                    <View style={styles.infoViewLeft}>
                      <Text style={styles.textMessageLeft}>You've seen today's film!</Text>
                    </View>
                    <View style={styles.infoViewRight}>
                      <Text style={styles.textMessageRight}>Next Film{'\n'}{remainingTime}</Text>
                    </View>
                  </View>
                  <View style={styles.ratingAndShareContainer}>
                    <View style={styles.ratingContainer}>
                      {rating ? (
                        <View style={styles.rateItContainer}>
                          <Text style={styles.textRateMessage}>Your rating</Text> 
                          <TouchableOpacity onPress={handleGoToTop}><MaterialCommunityIcons name="trophy-award" size={32} color='rgba(0, 0, 0, 0.75)' style={styles.rankingButton}/></TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.rateItContainer}>
                          <Text style={styles.textRateMessage}>Rate it!</Text> 
                          <TouchableOpacity onPress={handleGoToTop}><MaterialCommunityIcons name="trophy-award" size={32} color='rgba(0, 0, 0, 0.75)' style={styles.rankingButton}/></TouchableOpacity>
                        </View>
                      )}
                      <View style={styles.starsContainer}>{renderStars()}</View>
                    </View>
                    <TouchableOpacity onPress={handleShare}>
                      <Ionicons name="share-outline" size={40} color="black" />
                    </TouchableOpacity>
                  </View>
                  </>
                ) : (
                  <>
                  <View style={styles.infoView}>
                    <View style={styles.infoViewLeft}>
                      <Text style={styles.textMessageLeft}>You (probably) haven't seen it.</Text>
                    </View>
                    <View style={styles.infoViewRight}>
                      <Text style={styles.textMessageRight}>Next Film{'\n'}{remainingTime}</Text>
                    </View>
                  </View>
                  <View style={styles.watchlistContainer}>
                    {watchlist ? (
                      <TouchableOpacity onPress={handleWatchlistPress}
                      style={{
                        ...styles.watchlistButton,
                        backgroundColor: darken(0.1, getContainerBackgroundColor()),
                      }}
                      >
                        <Text style={styles.watchlistButtonText}
                        >Watchlisted ✓</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={handleWatchlistPress}
                      style={{
                        ...styles.watchlistButton,
                        backgroundColor: darken(0.05, getContainerBackgroundColor()),
                      }}
                      >
                        <Text style={styles.watchlistButtonText}
                        >Add to watchlist</Text>
                      </TouchableOpacity>
                    )}
                    <></>
                    <TouchableOpacity onPress={handleShare}>
                      <Ionicons name="share-outline" size={40} color="black" />
                    </TouchableOpacity>
                  </View>
                  </>
                  )}
      
              </>
            ) : (
              <>
                <ZoomableImage frameSrc={frameSrc} scaleRef={scaleRef} />
                <View style={styles.buttonContainer}>
                  {buttonIndices.map((index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.indexButton,
                        index === currentIndex && styles.currentButton,
                      ]}
                      onPress={() => handleButtonPress(index)}
                    >
                      <Text style={styles.indexButtonText}>{`${index}`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {renderGuessMenu()}
                {
                searchString !== "" && suggestions && scaleRef.current == 1 &&(
                  <View>
                  {renderSuggestions()}
                  </View>
                )
                }
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Widescreen | 2023</Text>
                </View>
              </>
              
              
            )}
          </View>
        )
      )
    }
      <StatusBar style="auto" />
    </View> 
    </TouchableWithoutFeedback>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeedd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: {
    height: 355,
    alignItems: 'center',
    marginBottom: 120,
  },
  menuButton: {
    marginTop: 10,
    position: 'absolute',
    top: 30,
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
    position: 'absolute',
    top: 50,
    padding: 10,
    fontSize: 25,
    fontFamily: font1,
  },
  title: {
    marginTop: 200,
    fontSize: 30,
    fontFamily: font1,
  },
  ratingContainer: {
    marginRight: 25,
    alignItems: 'center',
  },
  frame: {
    position: 'relative',
    width: 350,
    height: 210,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 5,
    overflow: 'hidden',
  },
  posterContainer: {
    width: 250,
    height: 370,
    marginTop: 5,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 5,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  posterDescription: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterDescriptionText: {
    color: '#fff',
    fontSize: 22,
    textAlign: 'center',
    marginLeft: 30,
    marginRight: 30,
    fontFamily: font1,
  },
  buttonContainer: {
    zIndex: -2,
    flexDirection: 'row',
    alignItems: 'center', 
  },
  indexButton:{
    marginHorizontal: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 2,
  },
  currentButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  infoView:{
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center', 
    height: 80,
  },
  infoViewLeft: {
    width: '37%',
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 2,
    paddingRight: 20,
  },
  infoViewRight: {
    width: '35%',
  },
  textMessageLeft: {
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 18,
    fontFamily: font1,
  },
  textMessageRight: {
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 20,
    fontFamily: font1,
  },
  indexButtonText:{
    color: 'white',
    fontFamily: font1,
  },
  guessContainer: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center', 
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomWidth: 1,
    paddingBottom: 15,
  },
  attemptsText: {
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.8)',
    marginTop: 10,
    fontSize: 17,
    fontFamily: font1,
  },
  watchlistContainer: {
    marginTop: 20,
    flexDirection: 'row',
  },
  watchlistButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    marginRight: 30,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.7)',
  },
  watchlistButtonText:{
    color: 'black',
    fontSize: 18,
    fontFamily: font1,
  },
  guessButton:{
    marginLeft: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 5,
  },
  guessButtonText:{
    color: 'white',
    fontWeight: 'bold',
    fontFamily: font1,
  },
  guessInput: {
    width: 200,
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    paddingHorizontal: 10,
    fontSize: 18,
    borderRadius: 5,
    fontFamily: font1,
  },
  logo: {
    marginTop: 50,
    width: 60,
    height: 60,
  },
  starsContainer: {
    marginTop: 5,
    flexDirection: 'row',
  },
  star: {
    opacity: 0.8,
    fontSize: 30,
    marginRight: 5,
  },
  suggestionsContainer: {
    bottom: 97,
    left: -135,
    position: 'absolute',
  },
  suggestion: {
    width: 200,
    backgroundColor: 'grey',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginBottom: 1,
  },
  suggestionText: {
    color: 'white',
    fontSize: 20,
    fontFamily: font1,
  },
  footer: {
    position: 'absolute',
    alignItems: 'center',
    bottom: -180,
  },
  ratingAndShareContainer: {
    borderTopWidth: 2,
    borderTopColor: 'rgba(0, 0, 0, 0.3)',
    paddingTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  rateItContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    flexDirection: 'row',
  },
  rankingButton: {
    marginLeft: 5,
  },
  textRateMessage: {
    fontSize: 20,
    fontFamily: font1,
  },
  footerText: {
    bottom: 20,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: font1,
    color: 'rgba(0, 0, 0, 0.3)',
  },
});

export default Daily;