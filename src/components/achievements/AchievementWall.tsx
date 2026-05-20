import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { COLORS } from '../../utils/constants';
import { useAchievementStore } from '../../stores/achievementStore';
import { AchievementBadge } from './AchievementBadge';

interface AchievementWallProps {
  visible: boolean;
  onClose: () => void;
}

export function AchievementWall({ visible, onClose }: AchievementWallProps) {
  const { achievements } = useAchievementStore();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>🏅 成就徽章</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={achievements}
            keyExtractor={item => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => <AchievementBadge achievement={item} />}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  list: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-around',
    marginBottom: 12,
  },
});
