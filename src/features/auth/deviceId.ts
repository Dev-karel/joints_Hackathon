// device_id acak per instalasi, disimpan di SecureStore. Yang dikirim ke database
// hanya hash SHA-256-nya (trusted_devices.device_id_hash).
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'ayokmatch.device_id';

export async function getDeviceIdHash(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, id);
}
