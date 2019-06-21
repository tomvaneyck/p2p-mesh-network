const path = require('path');

module.exports = {
  entry: "./src/meshnetwork.ts",
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, "build/scripts"),
    filename: "meshnetwork.js",
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
 