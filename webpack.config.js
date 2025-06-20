const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (env, argv) => {
  // Detect if we're in development mode
  const isDevelopment = argv.mode === 'development' || process.env.NODE_ENV === 'development'
  
  return {
    mode: isDevelopment ? 'development' : 'production',
    entry: './src/app.js',
    context: path.resolve(__dirname, 'frontend'),
    output: {
      filename: isDevelopment ? 'bundle.js' : 'bundle.[contenthash].js',
      path: path.resolve(__dirname, 'frontend/dist'),
      publicPath: '/',
      clean: true // Clean output directory before each build
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
      poll: isDevelopment ? 1000 : false,
      ignored: /node_modules/,
    },
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    module: {
      rules: [
        {
          test: /.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        { 
          test: /\.js$/, 
          use: 'babel-loader', 
          exclude: /node_modules/ 
        },
        { 
          test: /\.css$/, 
          use: ['style-loader', 'css-loader'] 
        },
        { 
          test: /\.s(a|c)ss$/, 
          use: ['style-loader', 'css-loader', 'sass-loader'] 
        },
        { 
          test: /\.woff2?$/, 
          type: 'asset/resource' // Modern webpack 5 way
        },
        { 
          test: /\.(jpg|png|gif|svg)$/, 
          type: 'asset/resource' // Modern webpack 5 way
        }
      ]
    },
    // Only include devServer config in development
    ...(isDevelopment && {
      devServer: {
        static: 'src',
        open: true,
        port: 8000,
        historyApiFallback: true,
        hot: true, // Enable HMR
        proxy: [
          {
            context: ['/api'],
            target: 'http://127.0.0.1:4000',
            secure: false,
            changeOrigin: true
          }
        ]
      }
    }),
    plugins: [
      // Only include HMR plugin in development
      ...(isDevelopment ? [new webpack.HotModuleReplacementPlugin()] : []),
      
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        filename: 'index.html',
        inject: 'body',
        minify: isDevelopment ? false : {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        }
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser'
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer']
      }),
      
      // Add environment variable definitions
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production'),
        'process.env.DEBUG': JSON.stringify(isDevelopment)
      })
    ],
    
    // Optimization settings
    optimization: {
      minimize: !isDevelopment,
      splitChunks: isDevelopment ? false : {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
    
    // Performance hints only in production
    performance: {
      hints: isDevelopment ? false : 'warning'
    }
  }
}