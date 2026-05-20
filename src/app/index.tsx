import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';
import { useProfileStore } from '../stores/profileStore';
import { useAIProviderStore } from '../stores/aiProviderStore';

export default function IndexScreen() {
  const [isReady, setIsReady] = useState(false);
  const { profile, initialize: initProfile } = useProfileStore();
  const { initialize: initAI } = useAIProviderStore();

  useEffect(() => {
    async function bootstrap() {
      await Promise.all([initProfile(), initAI()]);
      setIsReady(true);
    }
    bootstrap();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Redirect href={profile.isOnboarded ? '/(tabs)/home' : '/onboarding/step1'} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
