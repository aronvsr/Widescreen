import React, { useRef, useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { TapGestureHandler, State } from 'react-native-gesture-handler';

const ZoomableImage = ({ frameSrc, scaleRef }) => {
  const baseScaleRef = useRef(1);
  const thresholdScale = 1.75;
  const imageRef = useRef(null);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [lastTapX, setLastTapX] = useState(null);

  const onDoubleTap = ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {
      setIsEnlarged(!isEnlarged);
      scaleRef.current = isEnlarged ? 1 : thresholdScale;
      baseScaleRef.current = isEnlarged ? 1 : thresholdScale;

      setLastTapX(nativeEvent.x);
    }
  };

  const calculateMarginLeft = () => {
    if (lastTapX !== null) {
      const imageWidth = 350; 
      const deviceWidth = Dimensions.get('window').width; 
      const fingerLocation = lastTapX - ((deviceWidth - imageWidth)/2);
      const offset = -(fingerLocation * 1.5 - 238);
      return (offset);
    }
    return 0;
  };

  return (
    <View style={{ flex: 1 }}>
      <TapGestureHandler onHandlerStateChange={onDoubleTap} numberOfTaps={isEnlarged ? 1 : 2}>
        <View>
          <Image
            ref={imageRef}
            style={[
              styles.image,
              {
                transform: [{ scale: scaleRef.current }],
                marginLeft: isEnlarged ? calculateMarginLeft() : 0,
                marginTop: isEnlarged ? 40 : 0,
              },
            ]}
            source={{ uri: frameSrc }}
          />
        </View>
      </TapGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    zIndex: 6,
    position: 'relative',
    width: 350,
    height: 210,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 5,
    overflow: 'hidden',
  },
});

export default ZoomableImage;
