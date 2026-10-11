-- Kuis kepribadian v1.2 (METHODOLOGY §4): teks 15 pertanyaan diganti, pemetaan skor ikut berubah.
-- Memperbarui tabel referensi personality_scoring yang diisi di migration seed. Tiap archetype
-- tetap 5x primer dan 5x sekunder. Jawaban yang sudah terkunci tidak dihitung ulang.
insert into personality_scoring (question_id, question_no, answer, primary_archetype, secondary_archetype) values
  ('q1', 1, 'A', 'mindsmith', 'groundbreaker'),
  ('q1', 1, 'B', 'heartkeeper', 'sagekeeper'),
  ('q2', 2, 'A', 'wildheart', 'heartkeeper'),
  ('q2', 2, 'B', 'sagekeeper', 'mindsmith'),
  ('q3', 3, 'A', 'sagekeeper', 'mindsmith'),
  ('q3', 3, 'B', 'groundbreaker', 'kindled_flame'),
  ('q4', 4, 'A', 'mindsmith', 'groundbreaker'),
  ('q4', 4, 'B', 'kindled_flame', 'wildheart'),
  ('q5', 5, 'A', 'heartkeeper', 'sagekeeper'),
  ('q5', 5, 'B', 'kindled_flame', 'wildheart'),
  ('q6', 6, 'A', 'wildheart', 'heartkeeper'),
  ('q6', 6, 'B', 'mindsmith', 'groundbreaker'),
  ('q7', 7, 'A', 'groundbreaker', 'kindled_flame'),
  ('q7', 7, 'B', 'heartkeeper', 'sagekeeper'),
  ('q8', 8, 'A', 'mindsmith', 'groundbreaker'),
  ('q8', 8, 'B', 'wildheart', 'heartkeeper'),
  ('q9', 9, 'A', 'kindled_flame', 'wildheart'),
  ('q9', 9, 'B', 'sagekeeper', 'mindsmith'),
  ('q10', 10, 'A', 'heartkeeper', 'sagekeeper'),
  ('q10', 10, 'B', 'groundbreaker', 'kindled_flame'),
  ('q11', 11, 'A', 'groundbreaker', 'kindled_flame'),
  ('q11', 11, 'B', 'sagekeeper', 'mindsmith'),
  ('q12', 12, 'A', 'kindled_flame', 'wildheart'),
  ('q12', 12, 'B', 'mindsmith', 'groundbreaker'),
  ('q13', 13, 'A', 'wildheart', 'heartkeeper'),
  ('q13', 13, 'B', 'sagekeeper', 'mindsmith'),
  ('q14', 14, 'A', 'heartkeeper', 'sagekeeper'),
  ('q14', 14, 'B', 'kindled_flame', 'wildheart'),
  ('q15', 15, 'A', 'wildheart', 'heartkeeper'),
  ('q15', 15, 'B', 'groundbreaker', 'kindled_flame')
on conflict (question_id, answer) do update
  set primary_archetype = excluded.primary_archetype,
      secondary_archetype = excluded.secondary_archetype;
