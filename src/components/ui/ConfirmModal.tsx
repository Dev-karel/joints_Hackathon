import type { ReactNode } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from './PrimaryButton';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string; // kosong = modal satu tombol (blocking)
  onCancel?: () => void;
  loading?: boolean;
  children?: ReactNode;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  loading = false,
  children,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={cancelLabel ? onCancel : undefined}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-[24px]">
        <View className="max-h-[88%] w-full overflow-hidden rounded-[24px] border border-white bg-white/95">
          <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }}>
            <Text className="text-[20px] font-bold text-ink">{title}</Text>
            <Text className="text-[14px] leading-[21px] text-inkMuted">{message}</Text>
            {children}
            <View className="gap-[10px] pt-[4px]">
              <PrimaryButton label={confirmLabel} onPress={onConfirm} loading={loading} />
              {cancelLabel && onCancel ? (
                <PrimaryButton
                  label={cancelLabel}
                  onPress={onCancel}
                  variant="outline"
                  disabled={loading}
                />
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
