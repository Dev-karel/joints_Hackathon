import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { glassShadow } from '@/components/glass/tokens';
import type { AnswerId, QuizQuestion } from '@/lib/validation/personalityQuiz';

type QuizQuestionCardProps = {
  question: QuizQuestion;
  selected: AnswerId | undefined;
  disabled?: boolean;
  onSelect: (answer: AnswerId) => void;
};

// Pertanyaan di atas, dua kotak jawaban bertumpuk vertikal (atas-bawah)
export function QuizQuestionCard({
  question,
  selected,
  disabled = false,
  onSelect,
}: QuizQuestionCardProps) {
  return (
    <View className="flex-1 gap-[24px]">
      {/* Pertanyaan - ukuran diperbesar */}
      <Text className="text-[28px] font-extrabold leading-[36px] text-slateInk">
        {question.prompt}
      </Text>
      
      {/* Pilihan jawaban - layout vertikal (atas-bawah) */}
      <View className="flex-1 gap-[16px]" style={{ minHeight: 300 }}>
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
              className={`flex-1 flex-row items-center gap-[16px] rounded-[20px] border-[1.5px] px-[20px] py-[18px] ${
                active ? 'border-primary bg-surfaceSky' : 'border-slate300 bg-white/60'
              }`}
            >
              {/* Badge A/B di kiri */}
              <View
                className={`h-[40px] w-[40px] items-center justify-center rounded-full ${
                  active ? 'bg-primary' : 'bg-slateSurface'
                }`}
              >
                <Text
                  className={`text-[16px] font-bold ${active ? 'text-white' : 'text-slate500'}`}
                >
                  {option.id}
                </Text>
              </View>
              
              {/* Text jawaban di kanan */}
              <Text className="flex-1 text-[18px] font-semibold leading-[26px] text-slateInk">
                {option.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
