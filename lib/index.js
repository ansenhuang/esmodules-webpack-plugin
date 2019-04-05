const path = require('path');
const webpack = require('webpack');

const pluginName = 'ESModulesWebpackPlugin';
const loader = path.join(__dirname, './loader.js');
const errorCache = {};
const errorMsg = (msg, cacheKey) => {
  if (cacheKey) {
    if (errorCache[cacheKey]) return;
    errorCache[cacheKey] = msg;
  }
  console.log(`\u001b[36m[${pluginName}]\u001b[39m \u001b[31m${msg}\u001b[39m`);
};
const getExtname = filename => path.extname(filename).split('?')[0];
const getModuleFilename = filename => filename.replace(/\.(\w+)(\?.*)?$/, '.module.$1$2');

class ESModulesWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    this.compiler = compiler;

    // esmodules webpack config
    if (this.options.webpackConfig) {
      this.webpackConfig = this.options.webpackConfig
    } else {
      this.webpackConfig = this.generateWebpackConfig();
    }

    // esmodules compiler
    this.esmCompiler = webpack(this.webpackConfig);
    this.esmCompiler.hooks.shouldEmit.tap(pluginName, esmCompilation => {
      this.compilerCallback && this.compilerCallback(esmCompilation);
      return false;
    });

    // watch
    compiler.hooks.watchRun.tap(pluginName, () => {
      // rebuild esmodules
      this.esmCompilation = null;
    });

    // output information
    const output = this.esmCompiler.options.output;
    this.publicPath = output.publicPath;
    this.filenameExt = getExtname(output.filename);

    const insHtmlWebpackPlugin = compiler.options.plugins.find(plugin => plugin.constructor.name === 'HtmlWebpackPlugin');
    if (insHtmlWebpackPlugin) {
      this.HtmlWebpackPlugin = insHtmlWebpackPlugin.constructor;
      this.compileAtHtmlWebpackPlugin();
    } else {
      this.compileAtEmit();
    }
  }

  generateWebpackConfig() {
    const applyWebpackConfig = this.compiler.options;
    const webpackOptions = this.options.webpackOptions || {};
    const isDevelopment = applyWebpackConfig.mode === 'development';
    let styleLoader = this.options.styleLoader;
    if (typeof styleLoader === 'undefined') {
      styleLoader = isDevelopment ? 'style-loader' : null;
    } else if (typeof styleLoader !== 'string') {
      styleLoader = styleLoader ? 'style-loader' : null;
    }
    const defaultOptions = {
      output: {
        filename: getModuleFilename(applyWebpackConfig.output.filename),
        chunkFilename: getModuleFilename(applyWebpackConfig.output.chunkFilename),
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
          styleLoader && {
            test: /\.(css|postcss|pcss|sass|scss|less|styl)$/,
            use: [
              styleLoader,
              {
                loader: loader,
                options: {
                  useStyleLoader: true
                }
              },
            ],
          },
          {
            loader: loader,
            exclude: [/\.(js|mjs|jsx)$/, /\.html$/, /\.json$/],
          },
        ].filter(Boolean),
      },
    };
    const includePluginNames = [
      'DefinePlugin',
      'HotModuleReplacementPlugin',
    ];

    Object.keys(applyWebpackConfig).forEach(key => {
      if (defaultOptions[key]) {
        webpackOptions[key] = Object.assign({}, applyWebpackConfig[key], defaultOptions[key], webpackOptions[key]);
      } else if (key === 'plugins') {
        webpackOptions[key] = webpackOptions[key] || [];
        let existNames = webpackOptions[key].map(plugin => plugin.constructor.name);
        applyWebpackConfig[key].forEach(plugin => {
          let name = plugin.constructor.name;
          if (includePluginNames.indexOf(name) !== -1 && existNames.indexOf(name) === -1) {
            webpackOptions[key].push(plugin);
          }
        });
      } else if (key === 'devServer') {
        // remove this key
      } else {
        if (webpackOptions[key] == null) {
          webpackOptions[key] = applyWebpackConfig[key];
        } else if (typeof applyWebpackConfig[key] === 'object') {
          webpackOptions[key] = Object.assign({}, applyWebpackConfig[key], webpackOptions[key]);
        }
      }
    });

    return webpackOptions;
  }

  compileAtEmit() {
    this.compiler.hooks.emit.tapPromise(pluginName, compilation => {
      return this.compilePromise(compilation);
    });
  }

  compileAtHtmlWebpackPlugin() {
    const HtmlWebpackPlugin = this.HtmlWebpackPlugin;

    this.compiler.hooks.compilation.tap(pluginName, compilation => {
      const htmlHook = typeof HtmlWebpackPlugin.getHooks === 'function'
        ? HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups
        : compilation.hooks.htmlWebpackPluginAlterAssetTags;

      if (htmlHook) {
        htmlHook.tapPromise(pluginName, data => {
          return this.compilePromise(compilation).then(esmCompilation => {
            this.injectScriptsByHtmlPlugin(data, compilation, esmCompilation);
          });
        });
      } else {
        errorMsg('Something wrong with html-webpack-plugin, please upgrade to >=4!', 'html-webpack-plugin');
      }
    });
  }

  compilePromise(compilation) {
    if (this.esmCompilation) {
      return Promise.resolve(this.esmCompilation);
    }

    const esmCompiler = this.esmCompiler;
    esmCompiler._mainCompilation = compilation;
    esmCompiler.run((err) => {
      if (err) {
        errorMsg(err.message);
        return;
      }
    });

    return new Promise(resolve => {
      this.compilerCallback = esmCompilation => {
        this.esmCompilation = esmCompilation;
        compilation.assets = Object.assign({}, compilation.assets, esmCompilation.assets);
        // compilation.chunks = [].concat(compilation.chunks, esmCompilation.chunks);
        // compilation.modules = [].concat(compilation.modules, esmCompilation.modules);
        resolve(esmCompilation);
      };
    });
  }

  injectScriptsByHtmlPlugin(data, compilation, esmCompilation) {
    let files = [];
    let moduleInjectIndex;
    let headKey = data.head ? 'head' : 'headTags';
    let bodyKey = data.body ? 'body' : 'bodyTags';

    data[headKey].forEach((item, index) => {
      if (item.tagName === 'script') {
        item.attributes.nomodule = true;
        files.push(item.attributes.src.replace(this.publicPath, ''));
        if (moduleInjectIndex == null) {
          moduleInjectIndex = index;
        }
      }
    });
    data[bodyKey].forEach(item => {
      if (item.tagName === 'script') {
        item.attributes.nomodule = true;
        files.push(item.attributes.src.replace(this.publicPath, ''));
      }
    });

    // inject module script
    let moduleScripts = this.getModuleScripts(files, compilation, esmCompilation);
    if (moduleInjectIndex == null) {
      data[headKey] = data[headKey].concat(moduleScripts);
    } else {
      data[headKey] = [].concat(
        data[headKey].slice(0, moduleInjectIndex),
        moduleScripts,
        data[headKey].slice(moduleInjectIndex)
      );
    }
  }

  getModuleScripts(files, compilation, esmCompilation) {
    let scripts = [];
    files.forEach(file => {
      let mainChunk = compilation.chunks.find(chunk => chunk.files.indexOf(file) !== -1);
      if (mainChunk) {
        let esmChunk = esmCompilation.chunks.find(chunk => chunk.name === mainChunk.name);
        if (esmChunk && esmChunk.files.length > 0) {
          esmChunk.files.forEach(esmFile => {
            if (getExtname(esmFile) === this.filenameExt) {
              scripts.push({
                tagName: 'script',
                voidTag: false,
                attributes: {
                  type: 'module',
                  src: this.publicPath + esmFile,
                },
              });
            }
          });
        }
      }
    });
    return scripts;
  }
}

// static loader
ESModulesWebpackPlugin.loader = loader;

module.exports = ESModulesWebpackPlugin;
