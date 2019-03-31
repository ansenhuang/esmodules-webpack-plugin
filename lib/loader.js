module.exports = function(content) {
  const modules = this._compiler._injectModules || [];
  const module = modules.find(module => module.userRequest === this.resourcePath);

  if (module && module._source) {
    return module._source._value;
  }
  return content;
};
