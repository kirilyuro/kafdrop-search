import { AutoComplete } from 'primeng/autocomplete';
import { Tooltip } from 'primeng/tooltip';

/*
 * Chrome fires a window resize event on an extension popup even when the popup's dimensions are
 * unchanged. PrimeNG overlays hide themselves on resize, so they close the moment they open.
 * Keep that behaviour for resizes that actually change the viewport, ignore the rest.
 *
 * Upstream: https://issues.chromium.org/issues/555294645
 * Remove once fixed upstream and the Chrome floor is past it.
 */
export function ignoreSpuriousPopupResize(): void {
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  let viewportChanged = false;

  window.addEventListener('resize', () => {
    viewportChanged = window.innerWidth !== lastWidth || window.innerHeight !== lastHeight;
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
  }, true);

  const hideTooltip = Tooltip.prototype.onWindowResize;
  Tooltip.prototype.onWindowResize = function (event: Event): void {
    if (viewportChanged) {
      hideTooltip.call(this, event);
    }
  };

  const hideSuggestionsPanel = AutoComplete.prototype.onWindowResize;
  AutoComplete.prototype.onWindowResize = function (): void {
    if (viewportChanged) {
      hideSuggestionsPanel.call(this);
    }
  };
}
