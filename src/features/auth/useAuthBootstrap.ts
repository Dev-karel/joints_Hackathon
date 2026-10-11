import { useEffect } from 'react';

import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase/client';

import { sessionDeviceIsTrusted } from './api';
import { useAuthStore } from './authStore';

// Dipanggil sekali di root layout: memulihkan sesi tersimpan dan mengikuti perubahannya.
export function useAuthBootstrap() {
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      let session = data.session;
      // Sesi di HP yang tidak terdaftar di trusted_devices (mis. proses OTP tidak selesai)
      // tidak dipercaya: paksa masuk ulang.
      if (session && !(await sessionDeviceIsTrusted(session.user.id))) {
        await supabase.auth.signOut();
        session = null;
      }
      if (active) useAuthStore.setState({ session, ready: true });
    });

    // Jangan await panggilan Supabase di dalam callback ini (risiko deadlock).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') queryClient.clear();
      useAuthStore.setState({ session });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
}
