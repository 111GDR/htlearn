import { create } from "zustand";

interface SoundState {
  muted: boolean;
  init: () => void;
  toggle: () => void;
}

export const useSound = create<SoundState>((set, get) => ({
  muted: false,
  init: () => {
    set({ muted: localStorage.getItem("ht.sound.muted") === "1" });
  },
  toggle: () => {
    const muted = !get().muted;
    set({ muted });
    localStorage.setItem("ht.sound.muted", muted ? "1" : "0");
  },
}));
