const SCRABBLABAY_BG_SOUND_KEY = 'scrabblakbay_bg_sound_enabled';
const MUSIC_SOURCES = {
  overall: 'Music/overall-bg.mp3',
  ingame: 'Music/ingame-bg.mp3'
};
let bgAudio = null;
let soundEnabled = false;

function getBackgroundAudioSource() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('game.html')) {
    return MUSIC_SOURCES.ingame;
  }
  return MUSIC_SOURCES.overall;
}

function createBackgroundAudioElement() {
  if (bgAudio) return;
  const src = getBackgroundAudioSource();
  bgAudio = new Audio(src);
  bgAudio.loop = true;
  bgAudio.volume = 0.35;
  bgAudio.preload = 'auto';
}

function setSoundButtonState(button, enabled) {
  if (!button) return;
  button.textContent = enabled ? 'Sound: On' : 'Sound: Off';
  button.classList.toggle('active', enabled);
}

function toggleBackgroundSound(button) {
  if (!bgAudio) {
    createBackgroundAudioElement();
  }
  if (!bgAudio) return;

  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    bgAudio.play().catch(() => {
      // Autoplay may be blocked until user interacts, but the button state is still saved.
    });
  } else {
    bgAudio.pause();
  }

  if (button) {
    button.textContent = soundEnabled ? 'Sound: On' : 'Sound: Off';
    button.classList.toggle('active', soundEnabled);
  }

  localStorage.setItem(SCRABBLABAY_BG_SOUND_KEY, JSON.stringify(soundEnabled));
}

function initBackgroundSoundControl() {
  document.addEventListener('DOMContentLoaded', () => {
    const isGamePage = window.location.pathname.toLowerCase().includes('game.html');
    const existingButton = document.getElementById('bgSoundToggle');
    let button = existingButton;
    let wrapper = null;
    let target = document.querySelector('.title-screen') || document.querySelector('.page-header') || document.querySelector('.app') || document.body;
    if (!target) return;

    if (!button) {
      wrapper = document.createElement('div');
      wrapper.className = 'sound-control-bar';
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'bgSoundToggle';
      button.className = 'button secondary sound-toggle';
      button.textContent = 'Sound: Off';
      wrapper.appendChild(button);

      if (target.classList.contains('page-header') || target.classList.contains('app') || target.classList.contains('title-screen')) {
        target.insertBefore(wrapper, target.firstChild);
      } else {
        document.body.insertBefore(wrapper, document.body.firstChild);
      }
    }

    if (button) {
      button.addEventListener('click', () => toggleBackgroundSound(button));
    }

    const saved = localStorage.getItem(SCRABBLABAY_BG_SOUND_KEY);
    soundEnabled = saved === 'true';
    if (button) {
      setSoundButtonState(button, soundEnabled);
    }
    if (soundEnabled) {
      createBackgroundAudioElement();
      bgAudio.play().catch(() => {
        resumeBackgroundAudioOnInteraction();
      });
    }
  });
}

function resumeBackgroundAudioOnInteraction() {
  if (!bgAudio) return;

  const resume = () => {
    bgAudio.play().catch(() => {});
  };

  document.body.addEventListener('pointerdown', resume, { once: true });
  document.body.addEventListener('keydown', resume, { once: true });
}

initBackgroundSoundControl();