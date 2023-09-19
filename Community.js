import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, KeyboardAvoidingView, TextInput, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { lighten, darken } from 'polished';
import { useIsFocused } from '@react-navigation/native';
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

function Community({ navigation }) {
  const bottomSheetModalRef = useRef(null);
  const [PostsData, setPostsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [userID, setUserID] = useState(null);
  const [userName, setUserName] = useState(null);
  const isFocused = useIsFocused();
  const [isUploadingComment, setIsUploadingComment] = useState(false);
  const [isPostsFetched, setIsPostsFetched] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');


  function handlePresentModal(post) {
    setSelectedPost(post);
    setComments(post.comments);
    bottomSheetModalRef.current?.present();
  }

  useEffect(() => {
    loadUserID();
    loadUserName();
    retrievePreferences();
  }, []);

  useEffect(() => {
    if (isFocused && !isPostsFetched) {
      fetchPosts(); 
      setIsPostsFetched(true); 
    }
  }, [isFocused, isPostsFetched]);

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

  const initiateUpload = async () => {
    setIsUploadingComment(true); // Set this immediately
  
    if (commentInput.trim() !== '') {
      uploadComment(selectedPost.postID, userName, userID, commentInput);
      setCommentInput('');
    }
  }
  

  const uploadComment = async (postID, creatorName, creatorID, commentContent) => {
    try {
      const response = await fetch(
        `<link to get comment content>`,
        {
          method: 'GET',
        }
      );
  
      if (response.ok) {
        // Comment was uploaded successfully
        console.log('Comment uploaded successfully');
  
        // Create a new comment object
        const newComment = {
          creatorName: creatorName,
          creatorID: creatorID,
          commentContent: commentContent,
        };
  
        // Update the comments state with the new comment
        setComments((prevComments) => [...prevComments, newComment]);
  
        // Update the selected post with the new comment
        setSelectedPost((prevSelectedPost) => ({
          ...prevSelectedPost,
          comments: [...prevSelectedPost.comments, newComment],
        }));
  
        // Update the PostsData array with the updated post
        setPostsData((prevPostsData) =>
          prevPostsData.map((post) =>
            post.postID === postID
              ? {
                  ...post,
                  comments: [...post.comments, newComment],
                }
              : post
          )
        );
  
        // Clear the comment input field
        setIsUploadingComment(false);
        setCommentInput('');
      } else {
        // Handle errors, such as network errors or server errors
        console.error('Error uploading comment:', response.status);
      }
    } catch (error) {
      console.error('Error uploading comment:', error);
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

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await fetch('<url to fetch posts>');
      const data = await response.json(); 

      const sortedData = data.sort((a, b) => b.postID - a.postID);

      setPostsData(sortedData); 
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setIsLoading(false);
      setIsError(true);
    }
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
  

  const handleGoToPost = () => {
    setIsPostsFetched(false);
    bottomSheetModalRef.current?.close(); 
    navigation.navigate('Post', {userID, userName});
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

  const handleGoToProfile = (userID, userName) => {
    navigation.navigate('OtherProfile', {userID, userName});
  };

  function PostItem({ post }) {
    const imageSrc = `url to get post image`;
    const pfpSrc = `url to get pfp by userID`;
    return (
      <View style={[styles.postContainer, {backgroundColor: lighten(0.05, getContainerBackgroundColor())}]}>
        <TouchableOpacity onPress={() => handleGoToProfile(post.creatorID, post.creatorName)} style={styles.creditsContainer}>
            <Image source={{ uri: pfpSrc}} style={styles.creditsPfp}/>
            <Text style={styles.creditsText}>{post.creatorName} - {calculateTimeAgo(post.postDate)}</Text>
        </TouchableOpacity>
        
        <View style={styles.postContentContainer}>
          {
          post.containsImage == "yes" && (
            <View style={styles.postContentImageContainer}>
                <Image style={styles.postContentImage} source={{ uri: imageSrc}}/>
            </View>
          )
          }
          <View style={{...styles.postContentTextContainer, width: post.containsImage == "yes" ?  200 : 300 }}>
            <Text style={{...styles.postTitle, textAlign: post.containsImage == "yes" ?  null : 'center'}}>{post.postTitle}</Text>
            <Text style={{...styles.postContent, textAlign: post.containsImage == "yes" ?  null : 'center'}}>{post.postContent}</Text>
          </View>
        </View>
        <View style={styles.likesAndCommentsContainer}>
          <TouchableOpacity style={styles.likesContainer} onPress={() => handleLikeOrDislike(post)}>
            {
                post.likerID.includes(userID) ? (
                    <View><Ionicons name="heart" size={20} color="black" style={{marginRight: 10}}/></View>
                ) : (
                    <View><Ionicons name="heart-outline" size={20} color="black" style={{marginRight: 10}}/></View>
                )
            }
            {
                post.likerID.length == 1 ? (
                    <Text style={styles.creditsText}>{post.likerID.length} like</Text>
                ) : (
                    <Text style={styles.creditsText}>{post.likerID.length} likes</Text>
                )
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentsContainer} onPress={() => handlePresentModal(post)}>
            <View><Ionicons name="chatbox-outline" size={20} color="black" style={{marginRight: 10}}/></View>
            {
                post.comments.length == 1 ? (
                    <Text style={styles.creditsText}>{post.comments.length} comment</Text>
                ) : (
                    <Text style={styles.creditsText}>{post.comments.length} comments</Text>
                )
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderFooter = () => {
    if (!isLoading) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>You're all caught up!</Text>
        </View>
      );
    }
    return null;
  };

  const handleLikeOrDislike = async (post) => {
    if (post.likerID.includes(userID)) {
      handleDislike(post.postID)
    }
    else {
      handleLike(post.postID)
    }
  };

  const handleLike = async (postID) => {
    try {
      const response = await fetch('<url to like a post>', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postID: postID,
          userID: userID,
        }),
      });
  
      if (response.ok) {
        setPostsData((prevPosts) =>
          prevPosts.map((post) =>
            post.postID === postID
              ? {
                  ...post,
                  likerID: [...post.likerID, userID],
                }
              : post
          )
        );
      } else {
        console.error('Failed to like post:', response.status);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const handleDislike = async (postID) => {
    try {
      const response = await fetch('<url to dislike a post>', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postID: postID,
          userID: userID,
        }),
      });
  
      if (response.ok) {
        setPostsData((prevPosts) =>
          prevPosts.map((post) =>
            post.postID === postID
              ? {
                  ...post,
                  likerID: post.likerID.filter((id) => id !== userID),
                }
              : post
          )
        );
      } else {
        console.error('Failed to dislike post:', response.status);
      }
    } catch (error) {
      console.error('Error disliking post:', error);
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

  const renderPostItem = ({ item }) => {
    return (
      <PostItem
        post={item}
        onPress={() => {
        }}
      />
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <BottomSheetModalProvider>
      
        <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
            <BottomSheetModal
              ref={bottomSheetModalRef}
              index={0}
              enablePanDownToClose
              keyboardBlurBehavior='restore'
              snapPoints={['55%']}
              backgroundStyle={{
                borderRadius: 30,
                backgroundColor: lighten(0.035, getContainerBackgroundColor()),
              }}
            >
              <View style={{flex: 1}}>
                <Text style={styles.modalTitle}>Comments</Text>
                <View style={[styles.commentListContainer, {backgroundColor: lighten(0.06, getContainerBackgroundColor())}]}>
                  {comments.length === 0 ? (
                    <View style={styles.noCommentsContainer}>
                      <Image source={require('./images/emptychat.png')} style={styles.noCommentsImage} />
                      <Text style={styles.noCommentsText}>Be the first one to comment!</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={comments}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                        <View style={styles.commentContainer}>
                          <TouchableOpacity onPress={() => handleGoToProfile(item.creatorID, item.creatorName)}>
                            <Image
                              style={styles.commentPfp}
                              source={{ uri: `https://bpstudios.nl/widescreen_backend/friends/pfps/${item.creatorID}.jpg` }}
                            />
                          </TouchableOpacity>
                          <View>
                            <Text style={styles.commentAuthor}>{item.creatorName}</Text>
                            <Text style={styles.commentContent}>{item.commentContent}</Text>
                          </View>
                        </View>
                      )}
                    />
                  )}
                </View>
                <View style={styles.inputContainer}>
                  <BottomSheetTextInput
                    style={styles.input}
                    placeholder="Write a comment"
                    placeholderTextColor={'rgba(0, 0, 0, 0.3)'}
                    value={commentInput}
                    onChangeText={(text) => setCommentInput(text)}
                  />
                  {
                    isUploadingComment ? (
                      <ActivityIndicator style={styles.sendButton} size="small" color="#000000" />
                    ) : (
                      <TouchableOpacity
                        style={styles.sendButton}
                        onPress={() => {initiateUpload()}}
                      >
                        <MaterialIcons name="send" size={24} color="black" />
                      </TouchableOpacity>
                    )
                    }
                </View>
              </View>
            </BottomSheetModal>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <AntDesign name="back" size={30} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.goPostButton} onPress={handleGoToPost}>
            <AntDesign name="plus" size={30} color="black" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Community</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#000000" />
          ) : isError ? (
            <Text style={styles.errorText}>No internet or update available.</Text>
          ) : (
            <FlatList
              data={PostsData}
              keyExtractor={(item) => item.postID.toString()}
              renderItem={renderPostItem}
              ListFooterComponent={renderFooter}
            />
          )}
        </View>
    </BottomSheetModalProvider>
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
  backButton: {
    position: 'absolute',
    top: 48,
    left: 15,
    padding: 10,
  },
  goPostButton: {
    position: 'absolute',
    top: 48,
    right: 15,
    padding: 10,
  },
  pageTitle: {
    fontSize: 25,
    marginTop: 60,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: font1,
  },
  errorText: {
    fontSize: 20,
  },
  creditsContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  likesAndCommentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  commentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginLeft: 15
  },
  modalTitle: {
    textAlign: 'center',
    fontFamily: font1,
    fontSize: 20,
  },
  commentContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'center',
    borderColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginHorizontal: 20
  },
  commentTextContainer: {

  },
  commentAuthor: {
    fontFamily: font1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContent: {
    fontFamily: font1,
    fontSize: 18,
  },
  likesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginRight: 15,
  },
  creditsText: {
    fontSize: 16,
    fontFamily: font1
  },
  noCommentsContainer: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noCommentsImage: {
    height: 100,
    width: 100,
    marginBottom: 10
  },
  noCommentsText: {
    textAlign: 'center', 
    fontFamily: font1, 
    fontSize: 18,
    marginBottom: 30
  },
  creditsPfp: {
    width: 20,
    height: 20,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#EEEEDD'
  },
  postContainer: {
    width: 340,
    padding: 16,
    marginHorizontal: 15,
    borderRadius: 10, 
    marginBottom: 12,
    backgroundColor: '#fff', 
  },
  postContentContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContentImageContainer: {
    height: 120,
    width: 100,
    marginRight: 10,
  },
  postContentImage: {
    height: 120,
    width: 90,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#EEEEDD',
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  postContentTextContainer: {
    width: 200,
  },
  postTitle: {
    fontSize: 18,
    fontFamily: font1,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentListContainer: {
    flex: 1,
    marginHorizontal: '8%',
    marginTop: 10,
  },
  postContent: {
    fontSize: 18,
    fontFamily: font1,
    color: 'rgba(0, 0, 0, 0.9)',
  },
  footerContainer: {
    width: 250,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  footerText: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: font1,
    marginTop: 15,
    marginBottom: 35,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 15,
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
  commentPfp: {
    marginRight: 10,
    height: 30,
    width: 30,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: '#eeeedd',
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default Community;
