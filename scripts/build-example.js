const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const inquirer = require('inquirer');

const args = process.argv.slice(2);
const currentExample = args[0];
const isDev = ['--dev', '--development'].indexOf(args[1]) !== -1;

const examplesPath = path.join(__dirname, '../examples');
const examples = fs.readdirSync(examplesPath).filter(file => {
  return fs.statSync(path.join(examplesPath, file)).isDirectory();
});

const run = answer => {
  spawn(
    path.join(__dirname, '../node_modules/.bin', !answer.isDev ? 'webpack-cli' : 'webpack-dev-server'),
    [
      '--config',
      path.join(examplesPath, answer.example, 'webpack.config.js'),
    ],
    {
      stdio: 'inherit',
      env: Object.assign({}, process.env, {
        NODE_ENV: answer.isDev ? 'development' : 'production',
      }),
    }
  );
};

if (currentExample && examples.indexOf(currentExample) !== -1) {
  run({
    example: currentExample,
    isDev: isDev,
  });
} else {
  inquirer.prompt([
    {
      type: 'list',
      name: 'example',
      message: 'choose example',
      choices: examples,
    },
    {
      type: 'confirm',
      name: 'isDev',
      message: 'development?',
      default: isDev,
    }
  ]).then(answer => {
    run(answer);
  });
}
