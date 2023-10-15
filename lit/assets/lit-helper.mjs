import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3.0.0/lit-html.min.js';
import { classMap } from 'https://cdn.jsdelivr.net/npm/lit-html@3.0.0/directives/class-map.js';

const createApp = (args) => {
  const {
    selector,
    App,
    initialState,
    handler,
  } = args;

  const $s = new Proxy(initialState, {
    set(target, p, newValue) {
      if (target[p] === newValue) return false;
  
      target[p] = newValue;
      handler && handler(target, p, newValue);
      mount($s);

      return true;
    }
  });

  window.$s = $s;
  
  const mount = ($s) => render(App($s), document.querySelector(selector));

  mount($s);

  return {
    $s,
  }
}


export {
  createApp,
  html, render, classMap
}