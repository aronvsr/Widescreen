import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
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

function Reviews({ navigation, route }) {
  const { openLatest } = route.params;
  const [reviewsData, setReviewsData] = useState([]);
  const [expandedReviews, setExpandedReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);

  useEffect(() => {
    retrievePreferences();
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await fetch('<link to fetch reviews>');
      const data = await response.text();
      const reviews = parseReviewsData(data);
      setReviewsData(reviews);
      setIsLoading(false);
      if (openLatest == true) {
        toggleExpand(1);
      };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setIsLoading(false);
      setIsError(true);
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

  const parseReviewsData = (data) => {
    const reviews = [];
    const reviewItems = data.split('*');

    for (let i = 0; i < reviewItems.length; i += 5) {
      const title = reviewItems[i]?.trim();
      const rating = parseInt(reviewItems[i + 1]?.trim());
      const date = reviewItems[i + 2]?.trim();
      const imageUrl = reviewItems[i + 3]?.trim();
      const review = reviewItems[i + 4]?.trim();

      if (title && rating && date && imageUrl && review) {
        reviews.unshift({
          id: reviews.length + 1,
          title,
          rating,
          date,
          imageUrl,
          review,
        });
      }
    }

    return reviews.reverse();
  };

  const toggleExpand = (reviewId) => {
    setExpandedReviews((prevExpandedReviews) => {
      if (prevExpandedReviews.includes(reviewId)) {
        return prevExpandedReviews.filter((id) => id !== reviewId);
      } else {
        return [...prevExpandedReviews, reviewId];
      }
    });
  };

  const isReviewExpanded = (reviewId) => {
    return expandedReviews.includes(reviewId);
  };

  const renderReviewItem = ({ item }) => {
    const starIcons = [];
    const isPerfectScore = item.rating === 5;

    for (let i = 1; i <= 5; i++) {
      const starIconName = i <= item.rating ? 'star' : 'star-border';
      let starIconColor;

      if (isPerfectScore) {
        starIconColor = '#92cd28';
      } else if (item.rating === 4) {
        starIconColor = '#86B049';
      } else if (item.rating === 3) {
        starIconColor = '#f8d568';
      } else if (item.rating === 2) {
        starIconColor = '#ffa33f';
      } else if (item.rating === 1) {
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

    const reviewPreview = item.review.split(' ').slice(0, 5).join(' ');
    const isReviewPreviewVisible = !isReviewExpanded(item.id);

    return (
      <TouchableOpacity
        style={{
          ...styles.reviewContainer,
          backgroundColor: lighten(0.05, getContainerBackgroundColor()), 
        }}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.infoContainer}>
          <View>
            <View style={styles.titleContainer}>
              <Text style={styles.reviewTitle}>{item.title}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <View style={styles.starIconsContainer}>{starIcons}</View>
            </View>
          </View>
          <Image style={styles.reviewImage} source={{ uri: item.imageUrl }} />
        </View>
        {isReviewExpanded(item.id) && (
        <View style={styles.reviewTextContainer}>
          <Text style={styles.reviewText}>
              {item.review}
          </Text>
        </View>
        )}
        {isReviewExpanded(item.id) && (
          <Text style={styles.reviewDate}>Reviewed on {item.date}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoading) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Reviews are written by the Widescreen team.</Text>
        </View>
      );
    }
    return null;
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: getContainerBackgroundColor() }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name="back" size={30} color="black" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Reviews</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : isError ? (
        <Text style={styles.errorText}>No internet :(</Text>
      ) : (
        <FlatList
          data={reviewsData}
          renderItem={renderReviewItem}
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
  backButton: {
    position: 'absolute',
    top: 48,
    left: 15,
    padding: 10,
  },
  pageTitle: {
    fontSize: 25,
    marginTop: 60,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: font1,
  },
  reviewContainer: {
    width: 340,
    backgroundColor: '#fafaf0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 15,
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
    //backgroundColor: 'green',
    textAlignVertical: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  reviewTextContainer: {
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    paddingTop: 10,
    paddingBottom: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 18,
    fontFamily: font1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: font1,
  },
  starIconsContainer: {
    borderTopWidth: 1,
    width: 165,
    marginTop: 5,
    paddingTop: 10,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    flexDirection: 'row',
  },
  errorText: {
    fontSize: 20,
    fontFamily: font1,
    color: 'red',
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
});

export default Reviews;
