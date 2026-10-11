import { Pressable, Text, View } from 'react-native';

import type { AnswerId, QuizQuestion } from '@/lib/validation/personalityQuiz';

type QuizQuestionCardProps = {
  question: QuizQuestion;
  selected: AnswerId | undefined;
  disabled?: boolean;
  onSelect: (answer: AnswerId) => void;
};

export function QuizQuestionCard({ question, selected, disabled = false, onSelect }: QuizQuestionCardProps) {
  return (
    <View className="gap-[18px]">
      <Text className="text-[24px] font-bold leading-[32px] text-ink">{question.prompt}</Text>
      <View className="gap-[12px]">
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
              style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
              className={`flex-row items-center gap-[12px] rounded-[18px] border-[1.5px] px-[16px] py-[18px] ${
                active ? 'border-primary bg-surfaceSky' : 'border-borderSubtle bg-white'
              }`}>
              <View
                className={`h-[28px] w-[28px] items-center justify-center rounded-full ${
                  active ? 'bg-primary' : 'bg-slateSurface'
                }`}>
                <Text className={`text-[13px] font-bold ${active ? 'text-white' : 'text-inkMuted'}`}>
                  {option.id}
                </Text>
              </View>
              <Text className="flex-1 text-[16px] text-ink">{option.text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
