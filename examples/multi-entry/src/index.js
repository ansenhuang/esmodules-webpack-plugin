import './main.css';
import logo from './logo.png';

const rootEl = document.getElementById('root');

const h1 = document.createElement('h1');
h1.innerHTML = 'Hello world!';
rootEl.appendChild(h1);

const img = document.createElement('img');
img.src = logo;
rootEl.appendChild(img);

const isModule = typeof document.createElement('script').noModule !== 'undefined';
console.log('I was loaded via ' + (isModule ? 'module' : 'legacy') + '.');

// legacy will bundle with babel-polyfill, but esmodules won't
new Promise(resolve => {
  setTimeout(() => {
    resolve();
  }, 1000);
}).then(() => {
  console.log('I was resolved by Promise after 1000ms.');
});

import('./test').then(res => {
  console.log(res);
});
