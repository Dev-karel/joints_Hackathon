import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { glass } from '@/components/glass/tokens';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

// Lembar dari bawah (Figma "sheet-keluar" / "sheet-host-keluar"): latar redup, sudut atas 28,
// pegangan 40×4. Menekan latar menutupnya.
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 justify-end" behavior="padding">
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: glass.scrim }]}
          onPress={onClose}
          accessibilityLabel="Tutup"
          accessibilityRole="button"
        />
        <View className="max-h-[90%] rounded-t-[28px] bg-white">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}
          >
            <View className="h-[4px] w-[40px] rounded-[2px] bg-slateBorderMuted" />
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
