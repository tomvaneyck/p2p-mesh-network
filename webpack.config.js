const path = require('path');

module.exports = {
  entry: "./src/node.ts",
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, "test/scripts"),
    filename: "node.js",
    libraryTarget: "var",
    library: "Meshnetwork"
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  mode: "development"
};