import { strToEl } from '../utils.js';
import Ripple from './ripple.js';
import Spinner from './spinner.js';

export default class FloatingActionButton {
  constructor({ title, href, iconSvg, classList, major = false }) {
    this.container = strToEl(
      String((href ? '<a>' : '<div role="button" tabindex="0">') +
        iconSvg +
      (href ? '</a>' : '</div>'))
    );

    if (href) this.container.href = href;
    if (title) this.container.setAttribute('title', title);

    this.container.classList.add(major ? 'floating-action-button' : 'minor-floating-action-button');

    if (classList) {
      for (const className of classList) {
        this.container.classList.add(className);
      }
    }

    this._ripple = new Ripple();
    this.container.append(this._ripple.container);

    this._spinner = new Spinner();
    this.container.append(this._spinner.container);

    this.container.addEventListener('click', () => this.onClick());
  }

  onClick() {
    this._ripple.animate();
  }

  working() {
    this._spinner.show(500);
  }

  done() {
    this._spinner.hide();
  }
}
