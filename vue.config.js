const VueSSRServerPlugin = require("vue-server-renderer/server-plugin");
const VueSSRClientPlugin = require("vue-server-renderer/client-plugin");
const nodeExternals = require("webpack-node-externals");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const resolve = file => path.resolve(__dirname, file);
const isProd = process.env.NODE_ENV === "production";
const TARGET_NODE = process.env.BUILD_TARGET === "node";
const target = TARGET_NODE ? "server" : "client";

module.exports = {
  publicPath: "/",
  assetsDir: "static",
  css: {
    extract: true,
    sourceMap: !isProd
  },
  devServer: {
    headers: { "Access-Control-Allow-Origin": "*" },
    disableHostCheck: true
  },
  productionSourceMap: !isProd,
  transpileDependencies: [],
  configureWebpack: config => ({
    entry: `./src/entry-${target}.js`,
    target: TARGET_NODE ? "node" : "web",
    node: TARGET_NODE ? undefined : false,
    output: {
      libraryTarget: TARGET_NODE ? "commonjs2" : undefined
    },
    externals: TARGET_NODE
      ? nodeExternals({
          whitelist: [/\.css$/, /\?vue&type=style/]
        })
      : undefined,
    optimization: {
      splitChunks: TARGET_NODE ? false : undefined
    },
    plugins: [
      TARGET_NODE ? new VueSSRServerPlugin() : new VueSSRClientPlugin(),
      new webpack.DefinePlugin({
        "process.env.VUE_ENV": `'${target}'`,
        "process.env.NODE_DEPLOY": `'${process.env.NODE_DEPLOY}'`
      })
    ].concat(
      !isProd
        ? []
        : new CopyWebpackPlugin([
            {
              from: resolve("./server"),
              to: resolve("./dist/server"),
              toType: "dir",
              ignore: [".DS_Store"]
            }
          ])
    )
  }),
  chainWebpack: config => {
    config.resolve.alias
      .set("@", resolve("src"))
      .set("@assets", resolve("src/assets"));

    if (TARGET_NODE) {
      const isExtracting = config.plugins.has("extract-css");
      if (isExtracting) {
        const langs = ["css", "postcss", "scss", "sass", "less", "stylus"];
        const types = ["vue-modules", "vue", "normal-modules", "normal"];
        for (const lang of langs) {
          for (const type of types) {
            const rule = config.module.rule(lang).oneOf(type);
            rule.uses.delete("extract-css-loader");
            rule
              .use("vue-style")
              .loader("vue-style-loader")
              .before("css-loader");
          }
        }
        config.plugins.delete("extract-css");
      }

      config.module
        .rule("vue")
        .use("cache-loader")
        .tap(options => {
          // Change cache directory for server-side
          options.cacheIdentifier += "-server";
          options.cacheDirectory += "-server";
          return options;
        });
    }
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap(options => {
        if (TARGET_NODE) {
          options.cacheIdentifier += "-server";
          options.cacheDirectory += "-server";
        }
        options.optimizeSSR = TARGET_NODE;
        return options;
      });
    if (TARGET_NODE) {
      config.plugins.delete("hmr");
    }
  }
};
