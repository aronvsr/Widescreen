import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lighten } from 'polished';
import { Platform } from 'react-native';


let font1 = '';
if (Platform.OS === 'ios') {
    font1 = 'Baskerville';
} 
else if (Platform.OS === 'android') {
    font1 = Platform.select({
        android: 'sans-serif', 
        default: 'default font', 
    });
} 
else {
    font1 = 'default font'; 
}

function Chat({ navigation, route }) {
    const { contactUserID, myID, friendName } = route.params;
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatMessagesLength, setChatMessagesLength] = useState(null);
    const [readStatus, setReadStatus] = useState(null);
    const [userToken, setUserToken] = useState(null);


    useEffect(() => {
        retrievePreferences();
        retrieveChat();
        retrieveReadStatus();
        setChatMessagesLength(chatMessages.length)
    }, []);
    
    useEffect(() => {
        const interval = setInterval(retrieveChat, 1000);
        return () => clearInterval(interval); 
    }, [chatMessages]); 

    useEffect(() => {
        const interval = setInterval(retrieveReadStatus, 5000);
        return () => clearInterval(interval); 
    }, []); 

    const fetchToken = async () => {
        const encodedUserID = encodeURIComponent(contactUserID);
        const fetchUrl = `<link to fetch push token>`;
      
        try {
          const response = await fetch(fetchUrl);
      
          if (!response.ok) {
            setUserToken(null);
          }
      
          const pushToken = await response.text();
          setUserToken(pushToken);
        } catch (error) {
          console.error('Error fetching push token:', error.message);
          throw error;
        }
    };
      

    const retrieveChat = () => {
        const url = `<link to receive chat by IDs>`;
      
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            setIsLoading(false);
            if (data) {
                setChatMessages(data);
                const lastMessage = data.slice(-1)[0];
                if (lastMessage){
                    if (lastMessage.text.includes('m/') && chatMessagesLength != data.length) {
                        fetchMovieDataForMessages();
                        setChatMessagesLength(data.length);
                    }
                }
            }
          })
          .catch((error) => {
            console.error(error);
            setIsLoading(false);
          });
      };

    const retrieveReadStatus = () => {
        const url = `<link to fetch read status>`;
      
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            if (data) {
                setReadStatus(data);
            }
          })
          .catch((error) => {
            console.error(error);
          });
    };

    const sendNotification = async (token, notifTitle, notifBody) => {
        const expoUrl = '<link to send notif>';
        const notificationData = {
            title: notifTitle,
            body: notifBody,
            sound: 'default',
            data: {
                withSome: 'data',
                senderID: myID,
                receiverID: contactUserID,
                messageType: 'friendMessage'
            },
        };
    
        const formData = new FormData();
        formData.append('pushTokens', token);
        formData.append('title', notifTitle);
        formData.append('body', notifBody);
        formData.append('contactUserID', contactUserID); 
        formData.append('myID', myID); 
        formData.append('data', JSON.stringify(notificationData)); 
    
        try {
            const response = await fetch(expoUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            if (!response.ok) {
                throw new Error('Notification sending failed');
            }
    
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error('Error sending notification:', error.message);
            throw error;
        }
    };
    
      

    const retrievePreferences = async () => {
        fetchToken();
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

    const [movieDataMap, setMovieDataMap] = useState({});

    const fetchMovieDataForMessages = () => {
        const lastTwoMovieMessages = chatMessages
        .slice()
        .filter((message) => message.text.includes('m/'))
        .slice(-2);
            console.log('last 2 messages:');
            console.log(lastTwoMovieMessages);
            lastTwoMovieMessages.forEach((message) => {
            const movieTitle = message.text.split('m/').pop().trim();
            console.log(movieTitle);
            const omdbApiUrl = `http://www.omdbapi.com/?t=${movieTitle}&apikey=89ca7eb0`;

        console.log('api call');
        fetch(omdbApiUrl)
            .then((response) => response.json())
            .then((data) => {
            if (data && data.Poster && data.Title) {
                setMovieDataMap((prevMap) => ({
                ...prevMap,
                [message.id]: data,
                }));
            }
            })
            .catch((error) => {
            console.error(error);
            });
        });
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const renderItem = ({ item }) => {
    const isSender = item.senderId === myID;

    if (item.text.includes('m/')) {
        const movieData = movieDataMap[item.id];

        if (movieData) {
            return (
                <View style={[styles.chatContainer, { alignItems: isSender ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.messageBubble, { backgroundColor: isSender ? '#C2DEDC' : '#fafaf0'}]}>
                    <Text style={[styles.messageText, { color: isSender ? '#000' : '#333' }]}>{item.text}</Text>
                    <View style={styles.messageMovieContainer}>
                    <Image source={{ uri: movieData.Poster }} style={styles.messageMoviePoster} />
                    <View style={styles.messageMovieTextContainer}>
                        <Text style={styles.statText}>{movieData.Year}</Text>
                        <Text style={styles.statText}>{movieData.Rated}</Text>
                        <View style={styles.platformContainer}>
                            <Text style={styles.statText}>{movieData.imdbRating}</Text>
                            <Image source={require('./images/imdb.png')} style={styles.platformIcon} />
                        </View>
                    </View>
                    </View>
                </View>
                </View>
            );
        }
    }
        return (
            <View style={[styles.chatContainer, { alignItems: isSender ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.messageBubble, { backgroundColor: isSender ? '#C2DEDC' : '#fafaf0'}]}>
                <Text style={[styles.messageText, { color: isSender ? '#000' : '#333' }]}>{item.text}</Text>
            </View>
                {isSender && readStatus === 'read' && item.id === chatMessages[chatMessages.length - 1].id && (
                    <Text style={styles.seenText}>Seen</Text>
                )}
            </View>
        );
    };
    

    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;
      
        const newMessageObj = {
          id: Date.now().toString(),
          senderId: myID,
          text: newMessage
        };
      
        setChatMessages(prevChatMessages => [...prevChatMessages, newMessageObj]);
        setNewMessage('');
      
        const formData = new FormData();
        formData.append('myID', myID);
        formData.append('contactUserID', contactUserID);
        formData.append('newMessage', newMessage);
      
        fetch('<link to send message>', {
          method: 'POST',
          body: formData
        })
          .then(response => response.json())
          .then(async data => {
            try {
              const myName = await AsyncStorage.getItem('userName');
              if (userToken !== null) { 
                sendNotification(userToken, myName, newMessage, 'friendMessage');
                
              };
              setReadStatus('unread');
            } catch (error) {
              console.error('Error fetching user name from AsyncStorage:', error);
            }
          })
          .catch(error => {
            console.error('Error sending message:', error);
          });
      };
      

    const handleGoToProfile = (userID, userName) => {
        navigation.navigate('OtherProfile', {userID, userName});
    };


    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : null}
        >
            <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                <AntDesign name="back" size={30} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleGoToProfile(contactUserID, friendName)} style={styles.pageTitleContainer}>
                <Image style={styles.pfp} source={{ uri: `<link to get pfp by ID>` }} />
                <View>
                <Text style={styles.pageTitle}>{friendName}</Text>
                <Text style={styles.userIDText}>ID: {contactUserID}</Text>
                </View>
            </TouchableOpacity>

            {isLoading ? (
            <View style={styles.emptyChatList}>
                <ActivityIndicator size="large" color="#000"/>
            </View>
            ) : chatMessages.length === 0 ? (
                <View style={styles.emptyChatList}>
                <Image source={require('./images/emptychat.png')} style={styles.emptyChatImage} />
                </View>
            ) : (
                <FlatList
                data={chatMessages.slice().reverse()} 
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatList}
                inverted 
                />
            )}

            <View
                style={[
                styles.inputContainer,
                { backgroundColor: lighten(0.075, getContainerBackgroundColor()) }
                ]}

            >
                <TextInput
                style={styles.input}
                placeholder="Try m/Fallen Angels"
                placeholderTextColor={'rgba(0, 0, 0, 0.3)'}
                value={newMessage}
                onChangeText={setNewMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <MaterialIcons name="send" size={24} color="black" />
                </TouchableOpacity>
            </View>
            </View>
        </KeyboardAvoidingView>
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
    chatList: {
        width: 360,
        justifyContent: 'flex-end',
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 16,
        flexGrow: 1,
    },
    emptyChatList: {
        width: 360,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 16,
        flexGrow: 1,
    },
    chatContainer: {
        positioning: 'absolute',
        paddingHorizontal: 12,
        marginBottom: 6,
    },
    messageBubble: {
        borderColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        padding: 8,
        maxWidth: '70%',
    },
    messageText: {
        fontSize: 18,
        fontFamily: font1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 20,
        justifyContent: 'space-between',
        backgroundColor: '#fafaf0',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontFamily: font1,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.3)',
        fontSize: 16,
        marginRight: 8,
    },
    sendButton: {
        borderRadius: 20,
        padding: 8,
    },
    footerText: {
        fontSize: 18,
        textAlign: 'center',
        fontFamily: font1,
        marginTop: 15,
        marginBottom: 35,
    },
    messageMovieContainer: {
        flexDirection: 'row',
        paddingTop: 10,
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.3)',
    },
    messageMovieTextContainer: {
        justifyContent: 'center',
        marginLeft: 10,
    },
        statText: {
        fontFamily: font1,
        fontSize: 16,
        marginTop: 5,
        marginBottom: 5,
    },
    messageMoviePoster: {
        height: 120,
        width: 80,
        borderWidth: 1,
        backgroundColor: '#eeeedd',
        borderRadius: 8,
        borderColor: 'rgba(0, 0, 0, 0.3)',
    },
    pageTitle: {
        fontSize: 24,
        fontFamily: font1,
    },
    pageTitleContainer: {
        marginTop: 50,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    userIDText: {
        fontFamily: font1,
        fontSize: 16,
    },
    pfp: {
        marginRight: 10,
        marginTop: 5,
        height: 40,
        width: 40,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: '#eeeedd',
        borderColor: 'rgba(0, 0, 0, 0.3)',
    },
    platformContainer: {
    flexDirection: 'row',
        },
    platformIcon: {
        borderRadius: 3,
        height: 20,
        width: 20,
        marginBottom: 5,
        marginTop: 5,
        marginLeft: 6,
    },
    emptyChatImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 50,
    },
    seenText: {
        fontSize: 16,
        fontFamily: font1,
        color: '#aaa',
        alignSelf: 'flex-end',
        marginTop: 3,
        marginBottom: -3,
        marginRight: 8,
    },
});

export default Chat;
