const path = require('path');
const webpack = require('webpack');

const pluginName = 'ESModulesWebpackPlugin';
const loader = path.join(__dirname, './loader.js');
const errorMsg = msg => {
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
    const useStyleLoader = this.options.useStyleLoader;
    const isDevelopment = applyWebpackConfig.mode === 'development';
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
          (typeof useStyleLoader === 'undefined' ? isDevelopment : useStyleLoader) && {
            test: /\.(css|postcss|pcss|sass|scss|less|styl)$/,
            use: [
              'style-loader',
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
      const isNewHtmlPlugin = typeof HtmlWebpackPlugin.getHooks === 'function';

      (isNewHtmlPlugin
        ? HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups
        : compilation.hooks.htmlWebpackPluginAlterAssetTags
      ).tapPromise(pluginName, data => {
        return this.compilePromise(compilation).then(esmCompilation => {
          if (isNewHtmlPlugin) {
            this.injectScriptsByNewHtmlPlugin(data, compilation, esmCompilation);
          } else {
            this.injectScriptsByOldHtmlPlugin(data, compilation, esmCompilation);
          }
        });
      });
    });
  }

  compilePromise(compilation) {
    const esmCompiler = this.esmCompiler;
    esmCompiler._injectModules = Array.from(compilation._modules.values());
    esmCompiler.run((err) => {
      if (err) {
        errorMsg(err.message);
        process.exit();
      }
    });

    return new Promise(resolve => {
      this.compilerCallback = esmCompilation => {
        compilation.assets = Object.assign(
          {},
          compilation.assets,
          esmCompilation.assets
        );
        // compilation.chunks = [].concat(
        //   compilation.chunks,
        //   esmCompilation.chunks
        // );
        resolve(esmCompilation);
      };
    });
  }

  injectScriptsByNewHtmlPlugin(data, compilation, esmCompilation) {
    const moduleScripts = [];
    const pushModuleScripts = src => {
      let itemChunk = compilation.chunks.find(chunk =>
        chunk.files.indexOf(src.replace(this.publicPath, '')) !== -1
      );
      if (itemChunk) {
        this.collectModuleScript(moduleScripts, itemChunk.name, esmCompilation);
      }
    };

    data.headTags.forEach(item => {
      if (item.tagName === 'script') {
        item.attributes.nomodule = true;
        pushModuleScripts(item.attributes.src);
      }
    });
    data.bodyTags.forEach(item => {
      if (item.tagName === 'script') {
        item.attributes.nomodule = true;
        pushModuleScripts(item.attributes.src);
      }
    });

    // inject module script
    data.headTags = data.headTags.concat(moduleScripts);
  }

  injectScriptsByOldHtmlPlugin(data, compilation, esmCompilation) {
    data.head.forEach(item => {
      if (item.tagName === 'script') {
        item.attributes.nomodule = true;
      }
    });
    data.body.forEach(item => {
      if (item.tagName === 'script') {
        item.attributes.nomodule = true;
      }
    });
    // inject module script
    const moduleScripts = [];
    data.chunks.forEach(itemChunk => {
      this.collectModuleScript(moduleScripts, itemChunk.names[0], esmCompilation);
    });
    data.head = data.head.concat(moduleScripts);
  }

  collectModuleScript(scripts, chunkName, esmCompilation) {
    let esmChunk = esmCompilation.chunks.find(chunk => chunk.name === chunkName);
    if (esmChunk && esmChunk.files.length > 0) {
      esmChunk.files.forEach(file => {
        if (getExtname(file) === this.filenameExt) {
          scripts.push({
            tagName: 'script',
            voidTag: false,
            attributes: {
              type: 'module',
              src: this.publicPath + file,
            },
          });
        }
      });
    }
  }
}

// static loader
ESModulesWebpackPlugin.loader = loader;

module.exports = ESModulesWebpackPlugin;
