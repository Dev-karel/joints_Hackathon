import { create } from 'zustand';

export type MessageBannerData = {
  conversationId: string;
  title: string;
  body: string;
};

type BannerState = {
  banner: MessageBannerData | null;
  /** Percakapan yang sedang dibuka di layar (tidak perlu banner untuknya). */
  activeConversationId: string | null;
  show: (banner: MessageBannerData) => void;
  hide: () => void;
  setActiveConversation: (id: string | null) => void;
};

export const useBannerStore = create<BannerState>((set) => ({
  banner: null,
  activeConversationId: null,
  show: (banner) => set({ banner }),
  hide: () => set({ banner: null }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
}));
