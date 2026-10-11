import type { ReactNode } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { glass } from '@/components/glass/tokens';
import { Text } from '@/components/ui/AppText';

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
      <View
        className="flex-1 items-center justify-center px-[24px]"
        style={{ backgroundColor: glass.scrim }}
      >
        <View className="max-h-[88%] w-full overflow-hidden rounded-[24px] border border-white bg-white/95">
          <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }}>
            <Text className="text-[22px] font-extrabold text-slateInk">{title}</Text>
            <Text className="text-[14px] leading-[21px] text-slate500">{message}</Text>
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
