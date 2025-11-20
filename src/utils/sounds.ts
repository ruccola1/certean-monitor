/**
 * Sound Effects Utility
 * Generates modern, digital sounds using Web Audio API
 */

class SoundEffects {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play a success sound - upward digital chirp
   */
  playSuccess() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Oscillator for the main tone
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Modern digital success sound - rising frequency
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);

      // Envelope for smooth attack and release
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.type = 'sine';
      osc.start(now);
      osc.stop(now + 0.2);

      // Add a second harmonic for richness
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();

      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);

      osc2.frequency.setValueAtTime(1200, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.15);

      gainNode2.gain.setValueAtTime(0, now + 0.05);
      gainNode2.gain.linearRampToValueAtTime(0.15, now + 0.06);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc2.type = 'sine';
      osc2.start(now + 0.05);
      osc2.stop(now + 0.2);
    } catch (error) {
      console.warn('Failed to play success sound:', error);
    }
  }

  /**
   * Play an error sound - descending digital alert
   */
  playError() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // First beep - harsh digital alert
      const osc1 = ctx.createOscillator();
      const gainNode1 = ctx.createGain();

      osc1.connect(gainNode1);
      gainNode1.connect(ctx.destination);

      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.exponentialRampToValueAtTime(400, now + 0.1);

      gainNode1.gain.setValueAtTime(0, now);
      gainNode1.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc1.type = 'square'; // Harsher sound for errors
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Second beep - emphasis
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();

      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);

      osc2.frequency.setValueAtTime(600, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(300, now + 0.25);

      gainNode2.gain.setValueAtTime(0, now + 0.15);
      gainNode2.gain.linearRampToValueAtTime(0.25, now + 0.16);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc2.type = 'square';
      osc2.start(now + 0.15);
      osc2.stop(now + 0.3);
    } catch (error) {
      console.warn('Failed to play error sound:', error);
    }
  }

  /**
   * Play a processing sound - subtle digital pulse
   */
  playProcessing() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.frequency.setValueAtTime(440, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.type = 'sine';
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (error) {
      console.warn('Failed to play processing sound:', error);
    }
  }
}

// Export singleton instance
export const soundEffects = new SoundEffects();

