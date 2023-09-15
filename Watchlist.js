import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Animated, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lighten } from 'polished';
import { Swipeable } from 'react-native-gesture-handler';
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

function Watchlist({ navigation }) {
  const [watchlistData, setWatchlistData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [revealDelete, setRevealDelete] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  useEffect(() => {
    retrievePreferences();
    retrieveWatchlist();
  }, []);

  const retrieveWatchlist = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const watchlistKeys = keys.filter((key) => key.startsWith('watchlist_'));
      const watchlistItems = await AsyncStorage.multiGet(watchlistKeys);
  
      const data = watchlistItems.map((item) => {
        const [title, director, pegi, length] = item[0].replace('watchlist_', '').split('_');
        return {
          id: title,
          title: title,
          imageUrl: item[1],
          director: director,
          pegi: pegi,
          length: length,
        };
      });
  
      setWatchlistData(data);
      setIsLoading(false);
    } catch (error) {
      console.log('Error retrieving watchlist:', error);
    }
  };
  

  const handleRemoveItem = async (item) => {
    try {
      const key = `watchlist_${item.title}_${item.director}_${item.pegi}_${item.length}`;
      await AsyncStorage.removeItem(key);
      setWatchlistData((prevData) => prevData.filter((data) => data.id !== item.id));
    } catch (error) {
      console.log('Error removing item:', error);
    }
  };

  const handleLongPress = (item) => {
    setRevealDelete(true);
    setDeleteItemId(item.id);
  };

  const handleDeleteItem = () => {
    const itemToDelete = watchlistData.find((item) => item.id === deleteItemId);
    if (itemToDelete) {
      handleRemoveItem(itemToDelete);
    }
    setRevealDelete(false);
    setDeleteItemId(null);
  };

  const renderRightActions = (_, dragX, item) => {
    const swipeThreshold = 75; 

    const transX = dragX.interpolate({
      inputRange: [-swipeThreshold, 0],
      outputRange: [0, swipeThreshold],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity style={[styles.removeButton, { width: swipeThreshold }]} onPress={() => handleRemoveItem(item)}>
        <Animated.View style={{ transform: [{ translateX: transX }] }}>
          <MaterialIcons name="delete" size={24} color={getContainerBackgroundColor()} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderWatchlistItem = (item, index) => {
    return (
      <Swipeable key={item.id} renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
              <TouchableOpacity
        activeOpacity={1} 
        onPress={() => setRevealDelete(false)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={300}
      >
        <View
          style={{
            ...styles.filmContainer,
            backgroundColor: lighten(0.05, getContainerBackgroundColor()),
          }}
        >
          <View style={styles.filmTextContainer}>
            <Text style={styles.filmTitle}>{item.title}</Text>
            <Text style={styles.filmDirector}>{item.director}</Text>
            <Text style={styles.filmDetails}>{item.pegi} | {item.length}</Text>
          </View>
          <Image source={{ uri: item.imageUrl }} style={styles.filmImage} />
          {revealDelete && deleteItemId === item.id && (
            <TouchableOpacity style={styles.confirmDeleteButton} onPress={handleDeleteItem}>
              <MaterialIcons name="delete" size={35} color="#eeeedd" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      </Swipeable>
    );
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

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderWatchlistRows = () => {
    const rows = [];
    const numItems = watchlistData.length;
    const numRows = Math.ceil(numItems / 2);

    for (let i = 0; i < numRows; i++) {
      const startIndex = i * 2;
      const endIndex = startIndex + 1;
      const rowData = watchlistData.slice(startIndex, endIndex + 1);
      const row = (
        <View key={i} style={styles.watchlistRow}>
          {rowData.map(renderWatchlistItem)}
        </View>
      );
      rows.push(row);
    }

    return rows;
  };

  return (
    <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Watchlist</Text>
      {isLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} size="large" />
      ) : watchlistData.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyWatchlistContainer}>
          <Image source={require('./images/emptywatchlist3.png')} style={styles.emptyWatchlistImage} />
          <Text style={styles.emptyWatchlistText}>Your watchlist is empty</Text>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.watchlistContainer}>
          {renderWatchlistRows()}
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
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 25,
    marginTop: 60,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: font1,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 15,
    padding: 10,
  },
  watchlistContainer: {
    marginHorizontal: 10,
    alignItems: 'center',
  },
  filmContainer: {
    height: 150,
    width: 325,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafaf0',
    borderRadius: 8,
    paddingTop: 6,
    paddingBottom: 10,
    position: 'relative', 
    marginBottom: 20,
  },
  filmImage: {
    position: 'absolute',
    right: 10,
    width: 85,
    height: 120,
    marginHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'grey',
    backgroundColor: '#eeeedd',
  },
  filmTextContainer: {
    justifyContent: 'center',
    paddingLeft: 20,
  },
  filmTitle: {
    width: 190,
    fontSize: 20,
    fontWeight: '500',
    fontFamily: font1,
  },
  filmDirector: {
    width: 170,
    marginTop: 3, 
    marginBottom: 15, 
    fontSize: 19,
    fontFamily: font1,
  },
  filmDetails: {
    fontSize: 16,
    fontFamily: font1,
  },
  removeButton: {
    backgroundColor: '#F47174',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 20,
    height: 150,
  },
  confirmDeleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    height: 150,
    width: 210,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    padding: 6,
  },
  emptyWatchlistText: {
    fontSize: 22,
    fontFamily: font1,
    marginTop: 140,
    color: 'black',
  },
  emptyWatchlistContainer: {
    alignItems: 'center',
  },
  emptyWatchlistImage: {
    marginTop: 100,
    height: 120,
    width: 120,
    marginBottom: 10,
  },
  emptyWatchlistText: {
    fontSize: 18,
    fontFamily: font1,
  },
});

export default Watchlist;
