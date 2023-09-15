import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lighten } from 'polished';
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

function Top({ navigation }) {
  const [filmsData, setFilmsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(null);

  useEffect(() => {
    retrievePreferences();
    fetch('<link to fetch top films>') 
      .then((response) => response.json())
      .then((data) => {
        setFilmsData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, []);

  const renderFilmItem = ({ item, index }) => {
    return (
      <View style={{
        ...styles.filmContainer,
        backgroundColor: lighten(0.05, getContainerBackgroundColor()),
      }}
      onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rank}>{item.id}</Text>
        </View>
        <View style={styles.filmDetails}>
          <Text style={styles.filmTitle}>{item.title}</Text>
          <Text style={styles.filmDirector}>{item.director}</Text>
          <Text style={styles.moreInfo}>{item.moreInfo}</Text>
        </View>
        <Image source={{ uri: item.imageUrl }} style={styles.filmImage} />
      </View>
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

  const renderFooter = () => {
    if (!isLoading) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Based on average user rating.</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Top Rated Films</Text>
      {isLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} size="large" />
      ) : (
        <FlatList
          data={filmsData}
          renderItem={renderFilmItem}
          keyExtractor={(item) => item.id.toString()}
          ListFooterComponent={renderFooter}
        />
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
  filmContainer: {
    width: 320,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafaf0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  rankContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'gray',
    paddingRight: 12,
    marginRight: 12,
    height: 80,
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: font1,
  },
  filmImage: {
    width: 80,
    height: 100,
    marginLeft: 4,
    marginRight: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'grey',
    backgroundColor: '#eeeedd',
  },
  filmDetails: {
    flex: 1,
    marginLeft: 12,
  },
  filmTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: font1,
  },
  filmDirector: {
    fontSize: 18,
    fontFamily: font1,
    marginBottom: 10,
  },
  moreInfo: {
    fontSize: 14,
    fontFamily: font1,
  },
footerText: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: font1,
    marginTop: 15,
    marginBottom: 35,
}
});

export default Top;
