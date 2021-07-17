const path = require('path');
const Dotenv = require('dotenv-webpack');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  target: 'web',
  devtool: 'source-map',
  experiments: {
    outputModule: true,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
          terserOptions: {
              keep_classnames: true,
              keep_fnames: true
          }
        })
      ]
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'worker.mjs',
    libraryTarget: 'module',
    sourceMapFilename: 'worker.mjs.map',
  },
  plugins: [
    new Dotenv(),
  ],
};
