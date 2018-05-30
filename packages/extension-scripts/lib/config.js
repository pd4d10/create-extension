const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const OUTPUT_FOLDER = 'public'

const findDir = dir => path.resolve(dir)

const config = {
  output: {
    path: findDir(OUTPUT_FOLDER),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(OUTPUT_FOLDER, {
      root: process.cwd(),
    }),
    new CopyWebpackPlugin(
      [
        { from: 'src/static', to: 'static' },
        { from: 'src/manifest.json', to: '' },
      ],
      {}
    ),
  ],
}

const getFilePath = file => findDir(path.resolve('./src', file))

const withoutExt = file => {
  return file
    .split('.')
    .slice(0, -1)
    .join('.')
}

let manifest

if (fs.existsSync(getFilePath('manifest.json'))) {
  manifest = require(getFilePath('manifest.json'))
} else if (fs.existsSync(getFilePath('manifest.js'))) {
  manifest = require(getFilePath('manifest.js'))()
} else {
  throw new Error('Please provide manifest.json or js file')
}

// Add entries
config.entry = {}

// Background scripts
manifest.background.scripts.forEach(script => {
  config.entry[withoutExt(script)] = getFilePath(script)
})

const checkHtml = html => {
  const base = withoutExt(html)
  const js = getFilePath(base + '.js')
  const index = getFilePath(base + '/index.js')

  if (fs.existsSync(getFilePath(html))) {
  } else if (fs.existsSync(js)) {
    config.entry[base] = js
    config.plugins.push(
      new HtmlWebpackPlugin({
        filename: html,
        chunks: [base],
      })
    )
  } else if (fs.existsSync(index)) {
    config.entry[base] = index
    config.plugins.push(
      new HtmlWebpackPlugin({
        filename: html,
        chunks: [base],
      })
    )
  } else {
    throw new Error(`Please provide ${html}, ${js} or ${index}`)
  }
}

// BrowserAction popup
if (manifest.browser_action && manifest.browser_action.default_popup) {
  checkHtml(manifest.browser_action.default_popup)
}

// Options page
if (manifest.options_ui && manifest.options_ui.page) {
  checkHtml(manifest.options_ui.page)
}

module.exports = config