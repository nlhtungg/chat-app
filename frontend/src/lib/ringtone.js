// Ringtone generator using Tone.js
import * as Tone from 'tone';

export class Ringtone {
  constructor() {
    this.synth = new Tone.PolySynth().toDestination();
    this.pattern = null;
    this.isPlaying = false;
  }

  start() {
    if (this.isPlaying) return;

    // Make sure audio context is started (needed due to browser autoplay policies)
    Tone.start();

    // Create a repeating pattern for ringtone
    this.pattern = new Tone.Pattern(
      (time, note) => {
        this.synth.triggerAttackRelease(note, '8n', time);
      },
      ['C5', 'G4', 'E4', 'C4'],
      'upDown'
    );

    // Set pattern timing
    this.pattern.interval = '8n';

    // Set synth settings
    this.synth.set({
      volume: -8,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.4
      }
    });

    // Start pattern
    this.pattern.start(0);
    Tone.Transport.start();
    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) return;
    
    if (this.pattern) {
      this.pattern.stop();
      this.pattern.dispose();
      this.pattern = null;
    }
    
    Tone.Transport.stop();
    this.isPlaying = false;
  }

  dispose() {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }
}

// Singleton instance
let ringtoneInstance = null;

// Export functions
export function getRingtone() {
  if (!ringtoneInstance) {
    ringtoneInstance = new Ringtone();
  }
  return ringtoneInstance;
}

export function cleanup() {
  if (ringtoneInstance) {
    ringtoneInstance.dispose();
    ringtoneInstance = null;
  }
}
