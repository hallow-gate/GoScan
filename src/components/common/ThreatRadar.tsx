import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const RADAR_SIZE = width - 80;

export const ThreatRadar: React.FC = () => {
  const scanRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = scanRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulse = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  // Simulated threat points
  const threats = [
    { x: 60, y: 30, severity: 'high' },
    { x: 80, y: 60, severity: 'medium' },
    { x: 40, y: 70, severity: 'low' },
    { x: 70, y: 45, severity: 'high' },
    { x: 30, y: 40, severity: 'medium' },
  ];

  return (
    <View style={styles.container}>
      <Svg width={RADAR_SIZE} height={200} viewBox="0 0 100 100">
        {/* Radar circles */}
        <Circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="0.5" />
        <Circle cx="50" cy="50" r="30" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="0.5" />
        <Circle cx="50" cy="50" r="15" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="0.5" />
        
        {/* Cross lines */}
        <Line x1="50" y1="5" x2="50" y2="95" stroke="rgba(59,130,246,0.1)" strokeWidth="0.5" />
        <Line x1="5" y1="50" x2="95" y2="50" stroke="rgba(59,130,246,0.1)" strokeWidth="0.5" />
        
        {/* Threat points */}
        {threats.map((threat, index) => (
          <G key={index}>
            <Circle
              cx={threat.x}
              cy={threat.y}
              r="2"
              fill={threat.severity === 'high' ? '#ef4444' : threat.severity === 'medium' ? '#f59e0b' : '#10b981'}
            >
              <Animate attributeName="r" values="1;3;1" dur="2s" repeatCount="indefinite" />
            </Circle>
          </G>
        ))}
        
        {/* Scanning line */}
        <Animated.View style={[styles.scanLine, { transform: [{ rotate: spin }] }]}>
          <Svg width={RADAR_SIZE} height={200} viewBox="0 0 100 100">
            <Line
              x1="50"
              y1="50"
              x2="50"
              y2="5"
              stroke="url(#scanGradient)"
              strokeWidth="1.5"
            />
          </Svg>
        </Animated.View>
      </Svg>

      <Animated.View style={[styles.centerPoint, { transform: [{ scale: pulse }] }]}>
        <View style={styles.innerPoint} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(59,130,246,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
});
