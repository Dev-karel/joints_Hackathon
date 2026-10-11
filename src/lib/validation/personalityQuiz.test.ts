import { describe, expect, it } from '@jest/globals';

import {
  ARCHETYPE_IDS,
  QUESTION_COUNT,
  QUIZ_QUESTIONS,
  scoreAnswers,
  type AnswerId,
  type ArchetypeId,
  type QuizAnswers,
} from './personalityQuiz';

describe('pemetaan kuis (METHODOLOGY §10)', () => {
  it('15 pertanyaan, tiap pertanyaan 2 opsi dengan primer ≠ sekunder', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(15);
    for (const q of QUIZ_QUESTIONS) {
      expect(q.options.map((o) => o.id)).toEqual(['A', 'B']);
      for (const o of q.options) expect(o.primary).not.toBe(o.secondary);
    }
  });

  it('tiap archetype tepat 5× primer dan 5× sekunder', () => {
    const primary: Record<string, number> = {};
    const secondary: Record<string, number> = {};
    for (const o of QUIZ_QUESTIONS.flatMap((q) => q.options)) {
      primary[o.primary] = (primary[o.primary] ?? 0) + 1;
      secondary[o.secondary] = (secondary[o.secondary] ?? 0) + 1;
    }
    for (const id of ARCHETYPE_IDS) {
      expect(primary[id]).toBe(5);
      expect(secondary[id]).toBe(5);
    }
  });
});

describe('scoreAnswers', () => {
  const toAnswers = (picks: string): QuizAnswers =>
    Object.fromEntries(
      QUIZ_QUESTIONS.map((q, i) => [q.id, picks[i] as AnswerId]),
    );

  it('contoh METHODOLOGY §8 → heartkeeper 24.7%', () => {
    // q1 A, q2 B, q3 A, q4 A, q5 B, q6 A, q7 B, q8 B, q9 A, q10 A, q11 B, q12 A, q13 B, q14 A, q15 A
    const result = scoreAnswers(toAnswers('ABAABABBAABABAA'));
    expect(result.type).toBe('heartkeeper');
    expect(result.percentages.heartkeeper).toBeCloseTo(24.67, 1);
    expect(result.percentages.groundbreaker).toBeCloseTo(4.0, 1);
  });

  it('menolak jawaban yang belum lengkap', () => {
    expect(() => scoreAnswers({ q1: 'A' })).toThrow();
  });

  it('seluruh 32.768 kombinasi: total 100%, peluang menang tiap archetype 14,7%–18,9%', () => {
    const wins = Object.fromEntries(ARCHETYPE_IDS.map((id) => [id, 0])) as Record<ArchetypeId, number>;
    const combos = 2 ** QUESTION_COUNT;
    for (let mask = 0; mask < combos; mask++) {
      const picks = Array.from({ length: QUESTION_COUNT }, (_, i) => ((mask >> i) & 1 ? 'B' : 'A')).join('');
      const { type, percentages } = scoreAnswers(toAnswers(picks));
      const sum = Object.values(percentages).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 100)).toBeLessThan(0.01);
      wins[type] += 1;
    }
    for (const id of ARCHETYPE_IDS) {
      const share = (wins[id] / combos) * 100;
      expect(share).toBeGreaterThan(14.6);
      expect(share).toBeLessThan(19);
    }
  });
});
