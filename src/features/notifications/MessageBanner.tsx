import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';

import { useBannerStore } from './bannerStore';

const VISIBLE_MS = 4500;

// Banner "pesan baru" di atas layar saat aplikasi terbuka. Ketuk untuk membuka percakapan.
export function MessageBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const banner = useBannerStore((s) => s.banner);
  const hide = useBannerStore((s) => s.hide);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [banner, hide]);

  if (!banner) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 8 }}>
      <Pressable
        onPress={() => {
          const id = banner.conversationId;
          hide();
          router.push({ pathname: '/pesan/[id]', params: { id } });
        }}
        accessibilityRole="button"
        accessibilityLabel={`Pesan baru dari ${banner.title}: ${banner.body}`}
        className="mx-[16px] flex-row items-center gap-[12px] rounded-[18px] border border-slateBorder bg-white px-[14px] py-[12px]"
        style={{ elevation: 8 }}
      >
        <View className="h-[40px] w-[40px] items-center justify-center rounded-full bg-surfaceSky">
          <MessageCircle size={20} color={palette.primary} />
        </View>
        <View className="flex-1 gap-px">
          <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
            {banner.title}
          </Text>
          <Text className="text-[13px] text-slate500" numberOfLines={1}>
            {banner.body}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
