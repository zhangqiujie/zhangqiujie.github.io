import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';

export default {
  entry: './_javascript/react/tree/index.jsx',
  output: {
    path: path.resolve('./assets/js/dist'),
    filename: 'react-tree.min.js',
    library: 'TreeWidget',
    libraryTarget: 'window'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env','@babel/preset-react'],
            plugins: ['@babel/plugin-transform-class-properties','@babel/plugin-transform-private-methods']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader','css-loader','postcss-loader']
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  },
  mode: 'production'
};
