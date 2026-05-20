import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { COLORS } from '../../utils/constants';
import type { FoodEntry } from '../../types';

interface Props {
  entries: FoodEntry[];
}

export function PhotoGallery({ entries }: Props) {
  const [viewerEntry, setViewerEntry] = React.useState<FoodEntry | null>(null);

  if (entries.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 今日饮食记录</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {entries.map(entry => (
          entry.imageUri ? (
            <TouchableOpacity key={entry.id} style={styles.photoCard} onPress={() => setViewerEntry(entry)}>
              <Image source={{ uri: entry.imageUri }} style={styles.thumbnail} resizeMode="cover" />
              <Text style={styles.photoName} numberOfLines={1}>{entry.name}</Text>
              <Text style={styles.photoCal}>{entry.calories}kcal</Text>
            </TouchableOpacity>
          ) : null
        ))}
      </ScrollView>

      <Modal visible={!!viewerEntry} animationType="fade" transparent onRequestClose={() => setViewerEntry(null)}>
        {viewerEntry && (
          <View style={styles.viewerOverlay}>
            <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerEntry(null)}>
              <Text style={styles.viewerCloseText}>✕</Text>
            </TouchableOpacity>
            <Image source={{ uri: viewerEntry.imageUri }} style={styles.viewerImage} resizeMode="contain" />
            <View style={styles.viewerInfo}>
              <Text style={styles.viewerName}>{viewerEntry.name}</Text>
              <Text style={styles.viewerCal}>{viewerEntry.calories} kcal</Text>
              <Text style={styles.viewerMacro}>蛋白质 {viewerEntry.protein}g · 碳水 {viewerEntry.carbs}g · 脂肪 {viewerEntry.fat}g</Text>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  scroll: { flexDirection: 'row' },
  photoCard: { width: 100, marginRight: 10, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  thumbnail: { width: 88, height: 88, borderRadius: 8, backgroundColor: '#F0F0F0' },
  photoName: { fontSize: 12, fontWeight: '500', color: COLORS.text, marginTop: 4 },
  photoCal: { fontSize: 11, color: COLORS.textSecondary },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  viewerClose: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8 },
  viewerCloseText: { fontSize: 24, color: '#FFFFFF' },
  viewerImage: { width: '90%', height: '60%' },
  viewerInfo: { marginTop: 16, alignItems: 'center' },
  viewerName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  viewerCal: { fontSize: 16, color: '#FFFFFF', marginTop: 4 },
  viewerMacro: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
});
