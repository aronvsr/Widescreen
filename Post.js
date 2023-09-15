import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Touchable } from 'react-native';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { lighten } from 'polished';
import * as ImagePicker from 'expo-image-picker';

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

const Post = ({ navigation, route }) => {
  const { userID, userName } = route.params;
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);

  useEffect(() => {
    retrievePreferences();
  }, []);

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

  const selectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Sorry, we need camera roll permissions to make this work!'
        );
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3,4]
      });
  
      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error selecting image:', error);
    }
  };
  

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!title || !content) {
        Alert.alert('Validation Error', 'Please fill in all required fields.');
        return;
      }
    setIsLoading(true);

    // Create a FormData object to send the form data including the image file
    const formData = new FormData();
    formData.append('userID', userID);
    formData.append('userName', userName);
    formData.append('title', title);
    formData.append('content', content);
    formData.append('selectedTheme', selectedTheme);
    if (imageUri) {
        const imageFile = {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpeg',
        };
        formData.append('image', imageFile);
    }

    try {
      const response = await fetch('<link to submit post>', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const postID = await response.text(); 
        console.log('Post submitted successfully. Post ID:', postID);
        setTitle('');
        setContent('');
        setImageUri(null);
        setIsLoading(false);
        navigation.goBack(); 
      } else {
        console.log('Failed to submit post:', response.status);
        Alert.alert('Error', 'Failed to submit the post. Please try again later.');
      }
    } catch (error) {
        console.log('Error submitting post:', error);
        Alert.alert('Error', 'Failed to submit the post. Please try again later.');
    }
};


  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
    <View style={[styles.container, {backgroundColor: getContainerBackgroundColor()}]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Submit Post</Text>
        <View style={[styles.userInfo, {backgroundColor: lighten(0.05, getContainerBackgroundColor())}]}>
            <Image source={{ uri: `<link to get pfp>`}} style={styles.pfpImage}/>
            <Text style={styles.usernameText}>{userName}</Text>
        </View>
        
        <View style={[styles.formContainer, {backgroundColor: getContainerBackgroundColor()}]}>
            {
              isLoading == true ? (
                <View style={[styles.postView, {backgroundColor: lighten(0.05, getContainerBackgroundColor())}]}>
                    <ActivityIndicator size="large" color="#000000" />
                </View>
              ) :
              (
                <View style={[styles.postView, {backgroundColor: lighten(0.05, getContainerBackgroundColor())}]}>
                    <TextInput
                        style={styles.inputTitle}
                        placeholder="Enter title..."
                        placeholderTextColor={'rgba(0, 0, 0, 0.3)'}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={60}
                    />
                
                <View style={styles.contentView}>
                    <TouchableOpacity style={styles.imagePicker} onPress={selectImage}>
                        {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                        ) : (
                        <View style={styles.imageInstruction}>
                            <Ionicons name="image-outline" size={40} color="black" />
                            <Text style={styles.imageInstructionText}>(Optional)</Text>
                        </View>
                        )}
                    </TouchableOpacity>
                    <TextInput
                        style={styles.inputContent}
                        placeholder="Enter content..."
                        placeholderTextColor={'rgba(0, 0, 0, 0.3)'}
                        value={content}
                        onChangeText={setContent}
                        maxLength={300}
                        multiline
                    />
                </View>
                <TouchableOpacity onPress={handleSubmit}>
                    <View style={styles.submitButton}>
                        <Text style={styles.submitPostText}>Post</Text><Ionicons name="add" size={30} color="black"/>
                    </View>
                </TouchableOpacity>
            </View>
              )
            }
        </View>
        <View style={styles.guidelinesContainer}>
            <Text style={styles.guidelinesTitle}>Community Guidelines:</Text>
            <Text style={styles.guidelinesText}>
                • Must be film/tv related.{'\n'}
                • No unfunny shitposting.{'\n'}{'\n'}
                Posts that disregard these{'\n'}rules will be removed.
            </Text>
        </View>
    </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeedd',
    alignItems: 'center',
    justifyContent: 'center',
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
  formContainer: {
    alignItems: 'center',
    backgroundColor: '#eeeedd',
    padding: 16,
  },
  postView: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white'
  },
  contentView: {
    paddingBottom: 10,
    marginBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
  },
  inputTitle: {
    width: 250,
    borderWidth: 1,
    fontFamily: font1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 8,
    marginBottom: 16,
    fontSize: 18,
  },
  inputContent: {
    fontFamily: font1,
    width: 150,
    height: 180,
    marginLeft: 20,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 8,
    marginBottom: 16,
    fontSize: 18,
  },
  imagePicker: {
    width: 120,
    height: 160,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedImage: {
    width: 120,
    height: 160,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitPostText: {
    fontSize: 20,
    fontFamily: font1,
  },
  submitButton: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  imageInstruction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInstructionText: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: font1,
  },
  guidelinesContainer:{
    justifyContent: 'center',
    flex: 1,
    marginBottom: 20,
  },
  guidelinesTitle:{
    textAlign: 'center',
    fontSize: 18,
    fontFamily: font1,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.7)',
    marginBottom: 5,
  },
  guidelinesText:{
    textAlign: 'center',
    fontSize: 18,
    fontFamily: font1,
    color: 'rgba(0, 0, 0, 0.7)'
  },
  userInfo: {
    backgroundColor: '#eeeedd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  usernameText:{
    fontSize: 22,
    fontFamily: font1,
  },
  pfpImage:{
    marginRight: 10,
    height: 40,
    width: 40,
    borderRadius: 20,
  },
});

export default Post;