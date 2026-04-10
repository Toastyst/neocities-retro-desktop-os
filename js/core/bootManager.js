import { eventBus } from './eventBus.js';

class BootManager {
  constructor(bootConfig) {
    this.config = bootConfig;
  }

  createBootSequence(options = {}) {
    const config = {
      speed: options.speed || this.config.defaultOptions.speed,
      os: options.os || this.config.defaultOptions.os,
      hardware: options.hardware || this.config.defaultOptions.hardware,
      ...options
    };

    const speedMultipliers = {
      fast: 0.5,
      normal: 1.0,
      detailed: 1.5
    };
    const multiplier = speedMultipliers[config.speed];

    const hw = this.config.hardwareConfigs[config.hardware];
    const os = this.config.osConfigs[config.os];

    return [
      {
        text: os.bios,
        timing: Math.round(this.config.TIMINGS.BIOS_HEADER * multiplier),
        sound: this.config.SOUNDS.BIOS_BEEP,
        description: "BIOS header display"
      },
      {
        text: "Performing Power-On Self Test (POST)...\n",
        timing: Math.round(this.config.TIMINGS.POST_START * multiplier),
        sound: '',
        description: "POST initialization"
      },
      {
        text: `CPU: ${hw.cpu} - OK\n`,
        timing: Math.round(this.config.TIMINGS.COMPONENT_CHECK * multiplier),
        sound: '',
        description: "CPU detection and test"
      },
      {
        text: `Memory Test: ${hw.ram} - OK\n`,
        timing: Math.round((this.config.TIMINGS.COMPONENT_CHECK + 100) * multiplier),
        sound: '',
        description: "RAM testing"
      },
      {
        text: `Hard Drive: ${hw.hdd} - OK\n`,
        timing: Math.round(this.config.TIMINGS.COMPONENT_CHECK * multiplier),
        sound: this.config.SOUNDS.HDD_ACCESS,
        description: "Primary storage detection"
      },
      {
        text: "Floppy Drive: 1.44MB - OK\n",
        timing: Math.round(this.config.TIMINGS.COMPONENT_CHECK * multiplier),
        sound: '',
        description: "Floppy drive detection"
      },
      {
        text: `CD-ROM: ${hw.cdrom} - OK\n`,
        timing: Math.round(this.config.TIMINGS.COMPONENT_CHECK * multiplier),
        sound: '',
        description: "Optical drive detection"
      },
      {
        text: `Video: ${hw.video} - OK\n`,
        timing: Math.round(this.config.TIMINGS.COMPONENT_CHECK * multiplier),
        sound: '',
        description: "Graphics adapter test"
      },
      {
        text: "Keyboard: Detected\n",
        timing: Math.round(this.config.TIMINGS.FAST * multiplier),
        sound: '',
        description: "Input device detection"
      },
      {
        text: "Mouse: Detected\n",
        timing: Math.round(this.config.TIMINGS.FAST * multiplier),
        sound: '',
        description: "Pointing device detection"
      },
      {
        text: "Serial Ports: COM1, COM2 - OK\n",
        timing: Math.round(this.config.TIMINGS.COMPONENT_CHECK * multiplier),
        sound: '',
        description: "Serial port enumeration"
      },
      {
        text: "Parallel Ports: LPT1 - OK\n\n",
        timing: Math.round(this.config.TIMINGS.COMPONENT_CHECK * multiplier),
        sound: this.config.SOUNDS.POST_COMPLETE,
        description: "Parallel port detection"
      },
      {
        text: os.osLoad,
        timing: Math.round(this.config.TIMINGS.FINAL_LOAD * multiplier),
        sound: this.config.SOUNDS.BOOT_SUCCESS,
        description: "OS kernel loading"
      }
    ];
  }

  run() {
    const bootScreen = document.getElementById('boot-screen');
    const biosText = bootScreen.querySelector('.bios-text');
    const textbox = document.createElement('div');
    textbox.className = 'boot-textbox';
    textbox.appendChild(biosText);
    bootScreen.appendChild(textbox);
    bootScreen.style.display = 'flex';
    let stepIndex = 0;
    let text = '';
    const sequence = this.createBootSequence();

    const nextStep = () => {
      if (stepIndex < sequence.length) {
        const currentStep = sequence[stepIndex];
        text += currentStep.text;
        biosText.textContent = text;
        const textbox = bootScreen.querySelector('.boot-textbox');
        textbox.scrollTop = textbox.scrollHeight;

        if (currentStep.sound) {
          // Assume playSound is global or imported
          if (window.playSound) window.playSound(currentStep.sound);
        }

        stepIndex++;
        setTimeout(nextStep, currentStep.timing);
      } else {
        setTimeout(() => {
          bootScreen.style.display = 'none';
          if (window.playSound) window.playSound('hdd-fan-loop.mp3');
          eventBus.emit('bootComplete');
        }, 1000);
      }
    };
    nextStep();
  }
}

export { BootManager };