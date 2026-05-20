import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonBlockProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({ width, height, borderRadius = 8, style }: SkeletonBlockProps) {
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[styles.block, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <SkeletonBlock width={120} height={120} borderRadius={60} />
      </View>
      <View style={styles.center}>
        <SkeletonBlock width={100} height={16} borderRadius={8} />
      </View>
      <View style={styles.row}>
        <SkeletonBlock width={80} height={10} borderRadius={5} />
        <SkeletonBlock width="60%" height={10} borderRadius={5} />
      </View>
      <View style={styles.row}>
        <SkeletonBlock width={80} height={10} borderRadius={5} />
        <SkeletonBlock width="50%" height={10} borderRadius={5} />
      </View>
      <View style={styles.row}>
        <SkeletonBlock width={80} height={10} borderRadius={5} />
        <SkeletonBlock width="40%" height={10} borderRadius={5} />
      </View>
      <View style={styles.card}>
        <SkeletonBlock width="100%" height={60} borderRadius={12} />
      </View>
    </View>
  );
}

export function AnalyzeSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <SkeletonBlock width={200} height={200} borderRadius={16} />
      </View>
      <View style={styles.center}>
        <SkeletonBlock width={180} height={16} borderRadius={8} />
      </View>
      <View style={styles.center}>
        <SkeletonBlock width={140} height={14} borderRadius={7} />
      </View>
    </View>
  );
}

export function ChatSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.alignEnd}>
        <SkeletonBlock width={200} height={40} borderRadius={16} />
      </View>
      <View style={styles.alignStart}>
        <SkeletonBlock width={250} height={60} borderRadius={16} />
      </View>
      <View style={styles.alignEnd}>
        <SkeletonBlock width={180} height={40} borderRadius={16} />
      </View>
      <View style={styles.alignStart}>
        <SkeletonBlock width={220} height={50} borderRadius={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  container: {
    paddingVertical: 12,
    gap: 10,
  },
  center: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  card: {
    paddingHorizontal: 16,
  },
  alignEnd: {
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  alignStart: {
    alignItems: 'flex-start',
    paddingLeft: 16,
  },
});
