const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  entry: './app.js', 
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.bundle.cjs',
    libraryTarget: 'commonjs2',
  },
  experiments: {
    outputModule: false,
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
  // ... any other configuration
};
