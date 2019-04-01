const loaderUtils = require('loader-utils');

module.exports = function(content) {
  const modules = this._compiler._injectModules || [];
  const options = loaderUtils.getOptions(this) || {};

  let findModule = null;
  if (!options.useStyleLoader) {
    findModule = modules.find(module =>
      module.userRequest === this.resourcePath
    );
  } else {
    findModule = modules.find(module =>
      module.userRequest && module.userRequest.indexOf(this.resourcePath) > 0
    );
  }

  return (findModule && findModule._source) ? findModule._source._value : content;
};
