import { createNanoEvents } from 'nanoevents';
import { domReady } from '../utils.js';
import MaterialSlider from './material-slider.js';
import Ripple from './ripple.js';

export default class Settings {
  constructor() {
    this.emitter = createNanoEvents();
    this._throttleTimeout = null;

    domReady.then(() => {
      this._pluginInputs = [...document.querySelectorAll('.settings .plugins input')];
      this._globalInputs = [...document.querySelectorAll('.settings .global input')];

      this._resetRipple = new Ripple();
      this._resetBtn = document.querySelector('.setting-reset');
      this._resetBtn.append(this._resetRipple.container);

      // map real range elements to Slider instances
      this._sliderMap = new WeakMap();

      // enhance ranges
      const ranges = document.querySelectorAll('.settings input[type=range]');
      for (const range of ranges) {
        this._sliderMap.set(range, new MaterialSlider(range));
      }

      this.container = document.querySelector('.settings');
      this._scroller = document.querySelector('.settings-scroller');

      this.container.addEventListener('input', event => this._onChange(event));
      this._scroller.addEventListener('wheel', event => this._onMouseWheel(event));
      this._resetBtn.addEventListener('click', () => this._onReset());

      // Stop double-tap text selection.
      // This stops all text selection which is kinda sad.
      // I think this code will bite me.
      this._scroller.addEventListener('mousedown', event => {
        if (event.target.closest('input[type=range]')) return;
        event.preventDefault();
      });
    });
  }

  _onMouseWheel(event) {
    // Prevents bounce effect on desktop.
    // Firefox uses DELTA_LINE on a mouse wheel, ignore it
    // 0 is "pixels"
    if (event.deltaMode === 0) {
      event.preventDefault();
      event.currentTarget.scrollTop += event.deltaY;
    }
  }

  _onChange(event) {
    clearTimeout(this._throttleTimeout);

    // throttle range
    if (event.target.type === 'range') {
      this._throttleTimeout = setTimeout(() => this.emitter.emit('change'), 150);
    } else {
      this.emitter.emit('change');
    }
  }

  _onReset() {
    this._resetRipple.animate();
    const oldSettings = this.getSettings();
    // Set all inputs according to their initial attributes
    for (const inputEl of this._globalInputs) {
      if (inputEl.type === 'checkbox') {
        inputEl.checked = inputEl.hasAttribute('checked');
      } else if (inputEl.type === 'range') {
        this._sliderMap.get(inputEl).value = inputEl.getAttribute('value');
      }
    }

    for (const inputEl of this._pluginInputs) {
      inputEl.checked = inputEl.hasAttribute('checked');
    }

    this.emitter.emit('reset', oldSettings);
    this.emitter.emit('change');
  }

  setSettings(settings) {
    for (const inputEl of this._globalInputs) {
      if (!(inputEl.name in settings)) continue;

      if (inputEl.type === 'checkbox') {
        inputEl.checked = settings[inputEl.name];
      } else if (inputEl.type === 'range') {
        this._sliderMap.get(inputEl).value = settings[inputEl.name];
      }
    }

    for (const inputEl of this._pluginInputs) {
      if (!(inputEl.name in settings.plugins)) continue;
      inputEl.checked = settings.plugins[inputEl.name];
    }
  }

  getSettings() {
    // fingerprint is used for cache lookups
    const fingerprint = [];
    const output = {
      plugins: {}
    };

    for (const inputEl of this._globalInputs) {
      if (inputEl.name !== 'gzip' && inputEl.name !== 'original') {
        if (inputEl.type === 'checkbox') {
          fingerprint.push(Number(inputEl.checked));
        } else {
          fingerprint.push(`|${inputEl.value}|`);
        }
      }

      if (inputEl.type === 'checkbox') {
        output[inputEl.name] = inputEl.checked;
      } else {
        output[inputEl.name] = inputEl.value;
      }
    }

    for (const inputEl of this._pluginInputs) {
      fingerprint.push(Number(inputEl.checked));
      output.plugins[inputEl.name] = inputEl.checked;
    }

    output.fingerprint = fingerprint.join(',');

    return output;
  }
}
