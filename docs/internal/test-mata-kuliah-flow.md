# Test Mata Kuliah Onboarding Flow

## ✅ Manual Testing Checklist

### 1. **Clean State Test** (User baru)
- [ ] User baru login -> diarahkan ke onboarding
- [ ] Selesai onboarding -> diarahkan ke quiz
- [ ] Selesai quiz (klik "Lanjutkan") -> diarahkan ke mata kuliah selection
- [ ] Mata kuliah selection menampilkan:
  - [ ] Title: "Pilih mata kuliah" 
  - [ ] Subtitle dengan konteks onboarding
  - [ ] Tidak ada tombol back
  - [ ] Helper text dengan tips
  - [ ] Daftar mata kuliah dengan checkbox
  - [ ] Tombol "Lanjutkan" disabled jika belum pilih
  - [ ] Warning message jika belum pilih mata kuliah

### 2. **Course Selection Test**
- [ ] Bisa pilih mata kuliah (max 5)
- [ ] Checkbox berfungsi dengan benar
- [ ] Tidak bisa pilih lebih dari 5 mata kuliah
- [ ] Counter jumlah mata kuliah update dengan benar
- [ ] Tombol "Lanjutkan" enabled setelah pilih minimal 1
- [ ] Save berhasil dan redirect ke beranda

### 3. **Flow Integration Test**
- [ ] Setelah pilih mata kuliah -> diarahkan ke beranda (tabs)
- [ ] User yang sudah pilih mata kuliah tidak lagi diarahkan ke course selection
- [ ] Partner recommendation sudah memperhitungkan mata kuliah yang dipilih

### 4. **Error Handling Test**
- [ ] Error jika gagal load mata kuliah
- [ ] Error jika gagal save pilihan
- [ ] Loading states berfungsi dengan benar

## 🔧 Technical Validation

### Phase Logic Test
```
User State -> Expected Phase:
- No session -> signedOut
- Has session, no quiz -> needsQuiz  
- Has session, quiz done, no courses -> needsCourses
- Has session, quiz done, has courses -> ready
```

### API Integration Test
```
- useCourses() returns course list
- useMyCourseIds() returns empty array for new user
- useSaveMyCourses() saves successfully
- After save, useMyCourseIds() returns saved course IDs
```

## 🎯 Success Criteria

Flow lengkap berhasil jika:
1. ✅ Routing automatic dari quiz ke course selection ke beranda
2. ✅ UI course selection user-friendly untuk onboarding
3. ✅ Tidak ada error atau crash
4. ✅ Data tersimpan dengan benar
5. ✅ User tidak bisa skip course selection

## 🚨 Known Issues

- TypeScript errors dari react-native-web compatibility (bukan blocker)
- Perlu real course data untuk testing yang realistis

## 📝 Testing Notes

Untuk testing manual, perlu:
1. Reset user state (clear data atau buat user baru)
2. Pastikan database memiliki course data 
3. Test di device/simulator yang tepat

Status: **READY FOR TESTING** ✅