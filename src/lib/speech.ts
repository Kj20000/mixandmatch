// iOS Safari requires an initial user-gesture-triggered utterance to "unlock" speechSynthesis.
let iosUnlocked = false;
let voicesLoaded = false;

const isIOS = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function unlockiOSSpeech(): void {
  if (iosUnlocked) return;
  iosUnlocked = true;
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  // Create and immediately cancel an utterance to warm up the API
  const u = new SpeechSynthesisUtterance('');
  synth.speak(u);
  synth.cancel();
}

// Pre-load voices (iOS loads them lazily)
function loadVoices(): void {
  if (voicesLoaded || !('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesLoaded = true;
  }
}

if ('speechSynthesis' in window) {
  // Initial voices load
  loadVoices();
  
  // Listen for voices to load
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    loadVoices();
  });
}

export function speakWord(word: string, audioUrl?: string): void {
  // Unlock iOS speech on first call (must be in gesture context)
  unlockiOSSpeech();

  // If there's an audio URL, try to play it (falls back to TTS if it fails)
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    audio.play().catch(() => {
      // Fallback to speech synthesis if audio fails
      speakWithSynthesis(word);
    });
    return;
  }
  
  // Use speech synthesis directly
  speakWithSynthesis(word);
}

function speakWithSynthesis(word: string): void {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  const ios = isIOS();
  
  // Cancel any ongoing speech
  if (synth.speaking || synth.pending) {
    synth.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;
  utterance.lang = 'en-US';

  // Try to set an English voice if available
  const voices = synth.getVoices();
  if (voices.length > 0) {
    // Prefer English voices
    const englishVoice = voices.find((v) => v.lang.startsWith('en-US')) ||
                         voices.find((v) => v.lang.startsWith('en')) ||
                         voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
  }

  const speakNow = () => {
    try {
      synth.speak(utterance);
      // On iOS, ensure speech starts
      if (ios && synth.paused) {
        synth.resume();
      }
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };

  // iOS needs a small delay to ensure setup is complete
  if (ios) {
    setTimeout(speakNow, 50);
  } else {
    speakNow();
  }
}

export function playCorrectSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
  } catch {}
}

export function playWrongSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}
