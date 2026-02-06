const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'production',
  entry: './src/ui/sidebar/webview/main.ts',
  output: {
    path: path.resolve(__dirname, 'out/webview'),
    filename: 'sidebar.js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.js', '.svelte'],
    alias: {
      svelte: path.resolve('node_modules', 'svelte/src/runtime')
    },
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      },
      {
        test: /\.svelte$/,
        use: [
          {
            loader: 'svelte-loader',
            options: {
              preprocess: require('svelte-preprocess')({
                typescript: {
                  transpileOnly: true
                }
              }),
              compilerOptions: {
                dev: false
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui/sidebar/webview/template.html',
      filename: 'sidebar.html',
      inject: 'body',
      minify: false
    })
  ],
  devtool: 'source-map'
};
