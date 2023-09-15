import React, { useState, useEffect } from 'react';
import { Linking, View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lighten } from 'polished';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';


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


function Preferences({ navigation }) {
  const [shareRatings, setShareRatings] = useState(false);
  const [shareWithFriends, setShareWithFriends] = useState(false);
  const [dailyNotif, setDailyNotif] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);

  useEffect(() => {
    retrievePreferences();
  }, []);

  const retrievePreferences = async () => {
    try {
      const preferences = await AsyncStorage.getItem('preferences');
      if (preferences !== null) {
        const parsedPreferences = JSON.parse(preferences);
        setShareRatings(parsedPreferences.shareRatings);
        setShareWithFriends(parsedPreferences.shareWithFriends);
        setDailyNotif(parsedPreferences.dailyNotif);
        setSelectedTheme(parsedPreferences.selectedTheme);
      } else {
        setShareRatings(true);
        setShareWithFriends(true);
        setDailyNotif(true);
        setSelectedTheme('Theme1');
      }
    } catch (error) {
      console.log('Error retrieving preferences:', error);
    }
  };

  const savePreferences = async () => {
    const preferences = {
      shareRatings,
      shareWithFriends,
      dailyNotif,
      selectedTheme,
    };
    try {
      await AsyncStorage.setItem('preferences', JSON.stringify(preferences));
    } catch (error) {
      console.log('Error saving preferences:', error);
    }
  };

  const handleTurnOnNotifs = async () => {
    const settings = await Notifications.getPermissionsAsync();
    const { status } = settings;
  
    if (status === 'granted') {
      setDailyNotif(!dailyNotif);
    } else {
      openNotificationSettings();
    }
  };

  const openNotificationSettings = () => {
    Linking.openSettings()
  };

  const handleShareRatingsToggle = () => {
    setShareRatings(!shareRatings);
  };

  const handleShareWithFriendsToggle = () => {
    setShareWithFriends(!shareWithFriends);
  };

  const handleDailyNotifToggle = () => {
    if (dailyNotif == false) {
      handleTurnOnNotifs();
    }
    else {
      setDailyNotif(false);
      removeTokenFromServer();
      

    }
  };

  const removeTokenFromServer = async () => {
    const currentUserID = await AsyncStorage.getItem('userID');
    try {
      const response = await fetch('<link to remove expo token from db>', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `userID=${encodeURIComponent(currentUserID)}`,
      });
  
      const data = await response.text();
      console.log(data); 
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };
  
  

  const handleThemeSelect = (theme) => {
    if (Platform.OS === 'ios') {
      setSelectedTheme(theme);
    }
  };

  const handleBackPress = () => {
    savePreferences();
    navigation.goBack();
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

  return (
    <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Preferences</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sharing</Text>
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceText}>Contribute to ranking</Text>
          <Switch
            value={shareRatings}
            onValueChange={handleShareRatingsToggle}
            trackColor={{ false: '#767577', true: 'green' }}
            thumbColor={shareRatings ? 'white' : 'white'}
          />
        </View>
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceText}>Share ratings with friends</Text>
          <Switch
            value={shareWithFriends}
            onValueChange={handleShareWithFriendsToggle}
            trackColor={{ false: '#767577', true: 'green' }}
            thumbColor={shareRatings ? 'white' : 'white'}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceText}>Notifications</Text>
          <Switch
            value={dailyNotif}
            onValueChange={handleDailyNotifToggle}
            trackColor={{ false: '#767577', true: 'green' }}
            thumbColor={shareRatings ? 'white' : 'white'}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        
        {Platform.OS === 'android' ? ( 
          <Text style={styles.androidMessage}>(Non-functional for Android)</Text>
          ) : 
          null
        }
        <View style={{
                  ...styles.themeContainer,
                  backgroundColor: lighten(0.05, getContainerBackgroundColor()), // Increase brightness by 20%
                }}>
          <TouchableOpacity
            style={[
              styles.themeItem,
              styles.themeItem1,
              selectedTheme === 'Theme1' && styles.selectedTheme,
            ]}
            onPress={() => handleThemeSelect('Theme1')}
          />
          <TouchableOpacity
            style={[
              styles.themeItem,
              styles.themeItem2,
              selectedTheme === 'Theme2' && styles.selectedTheme,
            ]}
            onPress={() => handleThemeSelect('Theme2')}
          />
          <TouchableOpacity
            style={[
              styles.themeItem,
              styles.themeItem3,
              selectedTheme === 'Theme3' && styles.selectedTheme,
            ]}
            onPress={() => handleThemeSelect('Theme3')}
          />
          <TouchableOpacity
            style={[
              styles.themeItem,
              styles.themeItem4,
              selectedTheme === 'Theme4' && styles.selectedTheme,
            ]}
            onPress={() => handleThemeSelect('Theme4')}
          />
        </View>
      </View>
      <View style ={styles.creditsContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
        <Ionicons name="logo-github" size={25} color='rgba(0, 0, 0, 0.6)' style={{marginRight: 10}}/>
        <Text style={styles.appCreditsSocial}>aronvisser19</Text>
        </View>
        <View style={styles.symbolsContainer}>
          <Ionicons name="logo-react" size={25} color='rgba(0, 0, 0, 0.6)' style={{marginHorizontal: 5}}/>
          <MaterialCommunityIcons name="language-php" size={26} color='rgba(0, 0, 0, 0.6)' style={{marginHorizontal: 5, marginTop: 1}}/>
          <Ionicons name="logo-javascript" size={25} color='rgba(0, 0, 0, 0.6)' style={{marginHorizontal: 5}}/>
        </View>
        <Text style={styles.appInspiredby}>Inspired by:</Text>
        <Text style={styles.appInspiration}>Framed.wtf | IMDB | Letterboxd</Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeedd',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  pageTitle: {
    fontSize: 25,
    fontFamily: font1,
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 15,
    padding: 10,
  },
  section: {
    width: '95%',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: font1,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  preferenceText: {
    fontSize: 20,
    fontFamily: font1,
  },
  themeContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafaf0',
    borderRadius: 8,
    padding: 5,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.5)',
  },
  themeItem: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  selectedTheme: {
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.5)',
  },
  themeItem1: {
    backgroundColor: '#eeeedd',
  },
  themeItem2: {
    backgroundColor: '#eed7a1',
  },
  themeItem3: {
    backgroundColor: '#FFD1DA',
  },
  themeItem4: {
    backgroundColor: '#DAF5FF',
  },
  creditsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appCredits: {
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 10,
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 20,
    fontFamily: font1
  },
  appCreditsSocial:{
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 20,
    fontFamily: font1
  },
  appInspiredby: {
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 30,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 10,
    fontSize: 18,
    fontFamily: font1
  },
  appInspiration: {
    textAlign: 'center',
    marginHorizontal: 30,
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
    fontFamily: font1
  },
  symbolsContainer: {
    marginTop: 10,
    flexDirection: 'row',
  },
  androidMessage: {
    fontSize: 18,
    fontFamily: font1,
  },
});

export default Preferences;
