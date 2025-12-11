import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';

const isDev = process.env.NODE_ENV !== 'production';

export default {
  entry: './_javascript/react/index.jsx',
  output: {
    path: path.resolve('./assets/js/build'),
    filename: 'react-components.min.js',
    clean: true
  },
  devtool: isDev ? 'source-map' : false,
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
  mode: isDev ? 'development' : 'production'
};
