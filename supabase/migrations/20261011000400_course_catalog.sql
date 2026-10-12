-- Ganti 10 mata kuliah contoh dengan kode dan SKS dari Katalog Kurikulum Computer Science 2025/2026
-- (BINUSIAN 2029). SKS "teori/praktikum" dijumlahkan: 4/2 = 6, 2/1 = 3 (cocok dengan total
-- 20 SKS per semester di katalog). UPDATE (bukan hapus) supaya pilihan pengguna di user_courses tetap.
update courses set code = 'COMP6878051', credits = 6 where code = 'CONTOH-ALGO';
update courses set code = 'COMP6879051', credits = 6 where code = 'CONTOH-DS';
update courses set code = 'COMP6893051', credits = 3 where code = 'CONTOH-DB';
update courses set code = 'COMP6894051', credits = 2 where code = 'CONTOH-OOP';
update courses set code = 'COMP6679004', credits = 4 where code = 'CONTOH-WEB';
update courses set code = 'MOBI6063004', credits = 4 where code = 'CONTOH-MOB';
update courses set code = 'CPEN6256051', credits = 3 where code = 'CONTOH-NET';
update courses set code = 'MATH6198051', credits = 4 where code = 'CONTOH-DM';
update courses set code = 'STAT6202051', credits = 2, name = 'Basic Statistics' where code = 'CONTOH-STAT';
-- Tidak ada di katalog dan tanpa kode resmi: kode buatan sendiri, 2 SKS.
update courses set code = 'ENG-ACADEMIC', credits = 2 where code = 'CONTOH-ENG';
