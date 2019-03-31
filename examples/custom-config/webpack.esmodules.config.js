const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESModulesWebpackPlugin = require('../..');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: path.join(__dirname, './src/index.js'),
  output: {
    path: path.join(__dirname, './dist'),
    publicPath: '/',
    filename: '[name].module.js',
  },
  optimization: {
    runtimeChunk: 'single'
  },
  module: {
    rules: [
      {
        test: /\.(js|mjs|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                modules: false,
                loose: true,
                useBuiltIns: false,
                targets: {
                  esmodules: true
                }
              }
            ]
          ],
        },
      },
      {
        loader: ESModulesWebpackPlugin.loader,
        exclude: [/\.(js|mjs|jsx)$/, /\.html$/, /\.json$/],
      }
    ],
  },
  plugins: [
    isDevelopment && new webpack.HotModuleReplacementPlugin(),
  ].filter(Boolean),
};
