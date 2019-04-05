const loaderUtils = require('loader-utils');

module.exports = function(content) {
  const options = loaderUtils.getOptions(this) || {};
  const mainModules = this._compiler._mainCompilation.modules;

  let mainModule;
  if (!options.useStyleLoader) {
    mainModule = mainModules.find(module =>
      module.userRequest === this.resourcePath
    );
  } else {
    mainModule = mainModules.find(module =>
      module.userRequest && module.userRequest.indexOf(this.resourcePath) > 0
    );
  }

  return (mainModule && mainModule._source) ? mainModule._source._value : content;
};
