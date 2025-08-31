const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development" || process.env.NODE_ENV === "development";
  const shouldAnalyze = env && env.analyze;

  return {
    mode: isDevelopment ? "development" : "production",
    entry: "./src/app.js",
    context: path.resolve(__dirname, "frontend"),
    output: {
      filename: isDevelopment ? "[name].js" : "[name].[contenthash].js",
      chunkFilename: isDevelopment ? "[name].chunk.js" : "[name].[contenthash].chunk.js",
      path: path.resolve(__dirname, "frontend/dist"),
      publicPath: "/assets/",
      clean: true
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx"],
      fallback: {
        buffer: require.resolve("buffer/"),
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
        vm: require.resolve("vm-browserify"),
        util: require.resolve("util")
      }
    },
    watchOptions: {
      poll: isDevelopment ? 1000 : false,
      ignored: /node_modules/
    },
    devtool: isDevelopment ? "eval-source-map" : "source-map",
    module: {
      rules: [
        {
          test: /.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/
        },
        {
          test: /\.js$/,
          use: "babel-loader",
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        },
        {
          test: /\.s(a|c)ss$/,
          use: ["style-loader", "css-loader", "sass-loader"]
        },
        {
          test: /\.woff2?$/,
          type: "asset/resource"
        },
        {
          test: /\.(jpg|png|gif|svg)$/,
          type: "asset/resource"
        }
      ]
    },
    ...(isDevelopment && {
      devServer: {
        static: "src",
        open: true,
        port: 8000,
        historyApiFallback: true,
        hot: true,
        proxy: [
          {
            context: ["/api"],
            target: "http://127.0.0.1:4000",
            secure: false,
            changeOrigin: true
          }
        ]
      }
    }),
    plugins: [
      ...(isDevelopment ? [new webpack.HotModuleReplacementPlugin()] : []),

      new HtmlWebpackPlugin({
        template: "src/index.html",
        filename: "index.html",
        inject: "body",
        minify: isDevelopment
          ? false
          : {
              removeComments: true,
              collapseWhitespace: true,
              removeAttributeQuotes: true
            }
      }),
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"]
      }),

      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(isDevelopment ? "development" : "production"),
        "process.env.DEBUG": JSON.stringify(isDevelopment)
      }),

      ...(shouldAnalyze
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: "server",
              analyzerHost: "localhost",
              analyzerPort: 8888,
              openAnalyzer: true,
              generateStatsFile: true,
              statsFilename: "bundle-stats.json",
              reportFilename: "bundle-report.html"
            })
          ]
        : [])
    ],

    optimization: {
      minimize: !isDevelopment,
      splitChunks: {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            name: "react-vendor",
            priority: 10
          },
          dataLibs: {
            test: /[\\/]node_modules[\\/](@tanstack\/react-query|@tanstack\/react-table)[\\/]/,
            name: "data-libs",
            priority: 9
          },
          uiLibs: {
            test: /[\\/]node_modules[\\/](framer-motion|react-select|react-toastify|bulma)[\\/]/,
            name: "ui-libs",
            priority: 8
          },
          utils: {
            test: /[\\/]node_modules[\\/](lodash|moment|axios|classnames)[\\/]/,
            name: "utils",
            priority: 7
          },
          polyfills: {
            test: /[\\/]node_modules[\\/](buffer|crypto-browserify|stream-browserify|util|vm-browserify|process)[\\/]/,
            name: "polyfills",
            priority: 6
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            priority: 5
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 4,
            enforce: true
          }
        }
      },
      concatenateModules: !isDevelopment,
      removeEmptyChunks: true,
      mergeDuplicateChunks: true,
      runtimeChunk: {
        name: "runtime"
      }
    },

    performance: {
      hints: isDevelopment ? false : "warning",
      maxEntrypointSize: 250000,
      maxAssetSize: 250000
    }
  };
};
