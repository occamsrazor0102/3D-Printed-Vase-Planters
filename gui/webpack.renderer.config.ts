import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  // Use relative asset paths so packaged file:// URLs resolve correctly
  output: {
    publicPath: './',
    filename: 'main_window/index.js',
    chunkFilename: 'main_window/[name].js',
  },
};
