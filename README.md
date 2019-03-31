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

This plugin build an extra JavaScript for ESModules, which supports load with `<script type="module" src="..."></script>`.

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

* Build 2 completely different files for modern and legacy browsers
* Avoid rebuild the assets except JavaScript
* Work well with HtmlWebpackPlugin
* ...

## Options

### `webpackConfig`

* Type: `Object`
* Required: `false`

Compile JavaScript for ESModules with this config, the plugin will inject any assets exclude `.js` that you compiled before, so we don't build assets twice.

### `webpackOptions`

* Type: `Object`
* Required: `false`

It also a webpackConfig for ESModules, but it will merge to defaultConfig which is based on our previous config, so it's flexible when you need to load some plugins or options.

## Examples

**webpack.config.js**

```js
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESModulesWebpackPlugin = require('esmodules-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: path.join(__dirname, './src/index.js'),
  output: {
    path: path.join(__dirname, './dist'),
    publicPath: '/',
    filename: '[name].js',
  },
  optimization: {
    runtimeChunk: 'single'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, './src'),
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                modules: false,
                loose: true,
                useBuiltIns: 'usage',
                corejs: 'corejs@3',
                targets: {
                  browsers: [
                    "last 4 versions",
                    "ie >= 9",
                    "iOS >= 7",
                    "Android >= 4"
                  ]
                }
              }
            ]
          ],
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]'
        }
      }
    ],
  },
  plugins: [
    !isDevelopment && new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, './template/index.html'),
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].chunk.css',
    }),
    new ESModulesWebpackPlugin(),
  ].filter(Boolean),
  devServer: {
    contentBase: path.join(__dirname, './dist'),
    watchContentBase: true,
    compress: true,
    port: 9000,
    overlay: true,
    hot: true,
    // quiet: true,
    // noInfo: true,
    clientLogLevel: 'none',
  }
};
```

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
