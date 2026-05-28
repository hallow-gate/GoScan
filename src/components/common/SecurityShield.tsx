import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SecurityShieldProps {
  score: number;
  size?: number;
}

export const SecurityShield: React.FC<SecurityShieldProps> = ({ score, size = 120 }) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getColor = () => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.glow, { opacity: glowOpacity, borderColor: color }]} />
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>
          
          {/* Outer ring */}
          <Circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="4,4"
          />
          
          {/* Progress ring */}
          <Circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={`${score * 3}, ${300 - score * 3}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          
          {/* Shield shape */}
          <Path
            d="M50 10 L85 25 L85 55 C85 70 65 85 50 90 C35 85 15 70 15 55 L15 25 Z"
            fill="url(#shieldGradient)"
            fillOpacity="0.2"
            stroke={color}
            strokeWidth="2"
          />
          
          {/* Checkmark */}
          <Path
            d="M35 50 L45 60 L65 40"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
});
