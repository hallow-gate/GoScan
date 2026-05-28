import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';

export const ScanAnimation: React.FC<{ isScanning: boolean }> = ({ isScanning }) => {
  const scanPosition = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanPosition, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanPosition, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanPosition.setValue(0);
      pulseOpacity.setValue(0.3);
    }
  }, [isScanning]);

  return (
    <View style={styles.container}>
      <Svg width="200" height="100" viewBox="0 0 200 100">
        <Rect
          x="0"
          y="0"
          width="200"
          height="100"
          fill="none"
          stroke="rgba(59,130,246,0.2)"
          strokeWidth="2"
          rx="10"
        />
        <Line
          x1="0"
          y1="50"
          x2="200"
          y2="50"
          stroke="rgba(59,130,246,0.5)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        <Circle cx="100" cy="50" r="3" fill="#3b82f6" />
      </Svg>
      <Animated.View style={[styles.scanLine, { opacity: pulseOpacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: '#3b82f6',
  },
});
