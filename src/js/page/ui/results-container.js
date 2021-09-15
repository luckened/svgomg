import { domReady } from '../utils.js';

export default class ResultsContainer {
  constructor(results) {
    this._results = results;

    domReady.then(() => {
      this._container = document.querySelector('.results-container');
      this._mobileContainer = document.querySelector(
        '.results-container-mobile',
      );
      this._query = matchMedia('(min-width: 640px)');

      this._query.addListener(() => this._positionResults());
      this._positionResults();
    });
  }

  _positionResults() {
    (this._query.matches ? this._container : this._mobileContainer).append(
      this._results.container,
    );
  }
}
