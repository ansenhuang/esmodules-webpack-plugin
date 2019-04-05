<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![downloads][downloads]][npm-url]
[![deps][deps]][deps-url]
<!-- [![tests][tests]][tests-url] -->

# esmodules-webpack-plugin

This plugin build an extra JavaScript for ESModules, it supports loading with `<script type="module" src="..."></script>`.

## Getting Started

To begin, you'll need to install `esmodules-webpack-plugin`:

```console
$ npm install esmodules-webpack-plugin --save-dev
```

Then add the plugin to your `webpack` config. For example:

**webpack.config.js**

```js
const ESModulesWebpackPlugin = require('esmodules-webpack-plugin');

module.exports = {
  plugins: [
    new ESModulesWebpackPlugin()
  ]
};
```

And run `webpack` via your preferred method.

## Features

* Build completely different files for both modern and legacy browsers
* Avoid rebuilding the assets except JavaScript
* Support html-webpack-plugin and inject scripts automatically
* ...

## Options

### `webpackConfig`

* Type: `Object`
* Required: `false`

Compile JavaScript for ESModules with this config, the plugin will inject any assets exclude `.js` that you compiled before, so we won't build assets twice.

**tips:** If `webpackConfig` is defined, `webpackOptions` will be ignored.

### `webpackOptions`

* Type: `Object`
* Required: `false`

It also a webpackConfig for ESModules, the difference is that it will merge the defaultConfig which is based on previous config, so it's flexible when you need to load some plugins or options.

### `styleLoader`

* Type: `String|Boolean`
* Required: `false`
* default: development=true, production=false

If `style-loader` was used, please let me know so we can deal with `css` and inject css to js.

## Examples

[Refer to here](./examples)

## License

[MIT](./LICENSE)


[npm]: https://img.shields.io/npm/v/esmodules-webpack-plugin.svg
[npm-url]: https://npmjs.com/package/esmodules-webpack-plugin

[node]: https://img.shields.io/node/v/esmodules-webpack-plugin.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/ansenhuang/esmodules-webpack-plugin.svg
[deps-url]: https://david-dm.org/ansenhuang/esmodules-webpack-plugin

[downloads]: http://img.shields.io/npm/dt/esmodules-webpack-plugin.svg?style=flat-square

[tests]: http://img.shields.io/travis/ansenhuang/esmodules-webpack-plugin.svg
[tests-url]: https://travis-ci.org/ansenhuang/esmodules-webpack-plugin
