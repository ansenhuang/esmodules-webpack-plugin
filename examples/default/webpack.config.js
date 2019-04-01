const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESModulesWebpackPlugin = require('../..');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: path.join(__dirname, './src/index.js'),
  output: {
    path: path.join(__dirname, './public/dist'),
    publicPath: '/dist/',
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
                corejs: 3,
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
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].chunk.css',
    }),
    new ESModulesWebpackPlugin(),
  ].filter(Boolean),
  devServer: {
    contentBase: path.join(__dirname, './public'),
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
