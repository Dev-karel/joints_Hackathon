import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { palette } from '@/components/onboarding/palette';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import {
  fetchQuizDrafts,
  quizErrorMessage,
  saveQuizAnswer,
  submitQuiz,
} from '@/features/personality/api';
import { QuizConstellationProgress } from '@/features/personality/components/QuizConstellationProgress';
import { QuizQuestionCard } from '@/features/personality/components/QuizQuestionCard';
import {
  QUESTION_COUNT,
  QUIZ_QUESTIONS,
  type AnswerId,
  type QuizAnswers,
} from '@/lib/validation/personalityQuiz';

const firstUnanswered = (answers: QuizAnswers) => {
  const index = QUIZ_QUESTIONS.findIndex((q) => !answers[q.id]);
  return index === -1 ? QUESTION_COUNT - 1 : index;
};

export default function KuisScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const profile = useProfile(userId);

  const drafts = useQuery({
    queryKey: ['quiz-drafts', userId],
    enabled: !!userId,
    queryFn: () => fetchQuizDrafts(userId!),
    staleTime: Infinity,
    gcTime: 0,
  });

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Muat draf jawaban sekali (turunan state saat render, bukan efek).
  if (drafts.data && answers === null) {
    setAnswers(drafts.data);
    setCurrent(firstUnanswered(drafts.data));
  }

  // Kuis sudah final: tidak ada form terisi yang bisa diedit (PRD §6.1) -> Beranda.
  if (profile.data?.personality_quiz_completed_at) return <Redirect href="/(tabs)" />;

  if (!answers || !userId) {
    return (
      <GlassBackground stars={false}>
        <SafeAreaView className="flex-1 items-center justify-center">
          {drafts.isError ? (
            <View className="items-center gap-[12px] px-[24px]">
              <Text className="text-center text-[14px] text-inkMuted">
                Gagal memuat kuis. Periksa internet kamu.
              </Text>
              <PrimaryButton label="Coba lagi" onPress={() => void drafts.refetch()} />
            </View>
          ) : (
            <ActivityIndicator color={palette.primary} />
          )}
        </SafeAreaView>
      </GlassBackground>
    );
  }

  const question = QUIZ_QUESTIONS[current];
  const selected = answers[question.id];
  const isLast = current === QUESTION_COUNT - 1;
  const answeredCount = Object.keys(answers).length;

  const select = async (answer: AnswerId) => {
    setError(null);
    const previous = answers[question.id];
    setAnswers({ ...answers, [question.id]: answer });
    setSaving(true);
    try {
      await saveQuizAnswer(userId, question.id, answer);
    } catch (e) {
      // Kembalikan pilihan agar tampilan sama dengan yang tersimpan di server.
      setAnswers((prev) => {
        const next = { ...(prev ?? {}) };
        if (previous) next[question.id] = previous;
        else delete next[question.id];
        return next;
      });
      setError(quizErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!selected) return;
    if (isLast) setConfirming(true);
    else setCurrent(current + 1);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitQuiz();
      router.replace('/(kuis)/hasil');
    } catch (e) {
      setSubmitting(false);
      setConfirming(false);
      setError(quizErrorMessage(e));
    }
  };

  return (
    <GlassBackground seed={21}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="gap-[6px] px-[24px] pb-[8px] pt-[16px]">
          <Text className="text-[13px] font-semibold text-primary">
            Pertanyaan {current + 1} dari {QUESTION_COUNT}
          </Text>
          <QuizConstellationProgress current={current} />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
          <QuizQuestionCard
            question={question}
            selected={selected}
            disabled={saving}
            onSelect={select}
          />
          {error ? <Text className="pt-[14px] text-[13px] text-coral">{error}</Text> : null}
        </ScrollView>

        <View className="flex-row items-center gap-[10px] px-[22px] pb-[18px] pt-[12px]">
          <Pressable
            onPress={() => setCurrent(current - 1)}
            disabled={current === 0 || saving}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            className={`h-[54px] w-[84px] items-center justify-center rounded-full border border-white bg-white/60 ${
              current === 0 ? 'opacity-30' : ''
            }`}
          >
            <ArrowLeft size={20} strokeWidth={2.2} color={palette.primary} />
          </Pressable>
          <Pressable
            onPress={next}
            disabled={!selected || saving}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Selesai' : 'Lanjut'}
            className={`h-[54px] flex-1 flex-row items-center justify-center gap-[9px] rounded-full bg-primary ${
              !selected || saving ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-[15px] font-semibold text-white">
              {isLast ? 'Selesai' : 'Lanjut'}
            </Text>
            <ArrowRight size={18} strokeWidth={2.2} color={palette.accent} />
          </Pressable>
        </View>

        <ConfirmModal
          visible={!started}
          title="Sebelum mulai"
          message={`Kuis ini terdiri dari ${QUESTION_COUNT} pertanyaan dan memakan waktu sekitar 3 menit. Jawab dengan jujur, karena hasilnya menjadi label kepribadian permanen di akunmu dan tidak bisa diulang. Kamu masih bisa menekan "Kembali" untuk mengubah jawaban sebelum mengirim.`}
          confirmLabel="Mulai"
          onConfirm={() => setStarted(true)}
        />

        <ConfirmModal
          visible={confirming}
          title="Kirim jawaban?"
          message={
            answeredCount < QUESTION_COUNT
              ? 'Masih ada pertanyaan yang belum dijawab. Kembali dan lengkapi dulu.'
              : 'Setelah dikirim, jawaban dan hasil tidak bisa diubah lagi.'
          }
          confirmLabel={answeredCount < QUESTION_COUNT ? 'Periksa lagi' : 'Ya, kirim'}
          onConfirm={() =>
            answeredCount < QUESTION_COUNT ? setConfirming(false) : void confirmSubmit()
          }
          cancelLabel={answeredCount < QUESTION_COUNT ? undefined : 'Periksa lagi'}
          onCancel={() => setConfirming(false)}
          loading={submitting}
        />
      </SafeAreaView>
    </GlassBackground>
  );
}
