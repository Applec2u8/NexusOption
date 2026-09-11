import winSound from "../assets/Sound/superpuyofans1234-winner-game-sound-404167.mp3";

// Pre-load audio for better performance on mobile and global use
export const winAudio = typeof window !== 'undefined' ? new Audio(winSound) : null;

export const playSuccessSound = () => {
  if (!winAudio) return;
  try {
    // Reset and play
    winAudio.currentTime = 0;
    winAudio.play().catch(e => {
      console.warn("Audio play blocked or failed:", e);
    });
  } catch (e) {
    console.error("Audio utility error:", e);
  }
};
