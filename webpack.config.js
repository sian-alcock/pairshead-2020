const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './src/app.js',
  context: path.resolve(__dirname, 'frontend'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'frontend/dist'),
    publicPath: '/'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    fallback: { 
      'buffer': require.resolve('buffer/'),
      'stream': require.resolve('stream-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'vm': require.resolve('vm-browserify'),
      'util': require.resolve('util')
    }
  },
  watchOptions: {
    poll: 1000,
    ignored: /node_modules/,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      { test: /\.js$/, use: 'babel-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.s(a|c)ss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
      { test: /\.woff2?$/, use: 'file-loader' },
      { test: /\.(jpg|png|gif|svg)$/, use: 'file-loader' }
    ]
  },
  devServer: {
    static: 'src',
    open: true,
    port: 8000,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://127.0.0.1:4000',
        secure: false,
        changeOrigin: true
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      filename: 'index.html',
      inject: 'body'
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ]
}
