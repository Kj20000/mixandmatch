// iOS Safari requires an initial user-gesture-triggered utterance to "unlock" speechSynthesis.
let iosUnlocked = false;

const isIOS = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function unlockiOSSpeech(): void {
  if (iosUnlocked) return;
  iosUnlocked = true;
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  const u = new SpeechSynthesisUtterance('unlock');
  u.volume = 0;
  synth.speak(u);
  if (synth.paused) synth.resume();
}

// Pre-load voices (iOS loads them lazily)
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    window.speechSynthesis.getVoices();
  });
}

export function speakWord(word: string, audioUrl?: string): void {
  // Unlock iOS speech on first call (must be in gesture context)
  unlockiOSSpeech();

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => speakWithSynthesis(word));
    return;
  }
  speakWithSynthesis(word);
}

function speakWithSynthesis(word: string): void {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  const ios = isIOS();
  if (synth.speaking || synth.pending) {
    if (ios) {
      // iOS Safari can drop speech if cancel() and speak() are back-to-back.
      synth.pause();
      synth.cancel();
      synth.resume();
    } else {
      synth.cancel();
    }
  }

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;
  utterance.lang = 'en-US';

  const voices = synth.getVoices();
  if (voices.length > 0) {
    const englishVoice = voices.find((v) => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;
  }

  const speakNow = () => {
    synth.speak(utterance);
    if (synth.paused) synth.resume();
  };

  if (ios) {
    setTimeout(speakNow, 0);
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
