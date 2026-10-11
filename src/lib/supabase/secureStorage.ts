// Penyimpanan sesi Supabase di expo-secure-store (ARCHITECTURE §6). SecureStore
// membatasi ±2 KB per item sedangkan sesi (JWT + refresh token) bisa lebih besar,
// jadi nilai dipecah ke beberapa potongan: <key>.n = jumlah potongan, <key>.<i> = isi.
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1500;

const countKey = (key: string) => `${key}.n`;
const partKey = (key: string, i: number) => `${key}.${i}`;

async function removeParts(key: string) {
  const raw = await SecureStore.getItemAsync(countKey(key));
  const count = raw ? Number.parseInt(raw, 10) : 0;
  for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(partKey(key, i));
  await SecureStore.deleteItemAsync(countKey(key));
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const raw = await SecureStore.getItemAsync(countKey(key));
    if (!raw) return null;
    const count = Number.parseInt(raw, 10);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(partKey(key, i));
      if (part === null) return null; // rusak sebagian: anggap tidak ada sesi
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await removeParts(key);
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(
        partKey(key, i),
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      );
    }
    await SecureStore.setItemAsync(countKey(key), String(count));
  },

  async removeItem(key: string): Promise<void> {
    await removeParts(key);
  },
};
