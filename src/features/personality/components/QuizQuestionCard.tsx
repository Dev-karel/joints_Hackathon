import { Pressable, Text, View } from 'react-native';

import { glassShadow } from '@/components/glass/tokens';
import type { AnswerId, QuizQuestion } from '@/lib/validation/personalityQuiz';

type QuizQuestionCardProps = {
  question: QuizQuestion;
  selected: AnswerId | undefined;
  disabled?: boolean;
  onSelect: (answer: AnswerId) => void;
};

// Pertanyaan di atas, dua kotak jawaban bersebelahan yang mengisi sisa tinggi layar
// supaya bagian tengah halaman tidak kosong.
export function QuizQuestionCard({
  question,
  selected,
  disabled = false,
  onSelect,
}: QuizQuestionCardProps) {
  return (
    <View className="flex-1 gap-[24px]">
      <Text className="text-[26px] font-bold leading-[34px] text-ink">{question.prompt}</Text>
      <View className="flex-1 flex-row gap-[12px]" style={{ minHeight: 260 }}>
        {question.options.map((option) => {
          const active = selected === option.id;
          return (
            <Pressable
              key={option.id}
              disabled={disabled}
              onPress={() => onSelect(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled }}
              accessibilityLabel={option.text}
              style={({ pressed }) => [glassShadow, pressed ? { opacity: 0.9 } : null]}
              className={`flex-1 items-center justify-center gap-[16px] rounded-[24px] border-2 px-[14px] py-[20px] ${
                active ? 'border-primary bg-surfaceSky' : 'border-white bg-white/60'
              }`}
            >
              <View
                className={`h-[36px] w-[36px] items-center justify-center rounded-full ${
                  active ? 'bg-primary' : 'bg-slateSurface'
                }`}
              >
                <Text
                  className={`text-[15px] font-bold ${active ? 'text-white' : 'text-inkMuted'}`}
                >
                  {option.id}
                </Text>
              </View>
              <Text className="text-center text-[18px] font-semibold leading-[26px] text-ink">
                {option.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
