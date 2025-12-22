import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
    // Renderer process
    {
        mode: 'development',
        entry: './src/renderer/index.tsx',
        target: 'electron-renderer',
        devtool: 'source-map',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'renderer.js'
        },
        watchOptions: {
            ignored: /node_modules/,
            aggregateTimeout: 300,
            poll: 1000
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader'
                },
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-react']
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader']
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx']
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/renderer/index.html'
            })
        ]
    },
    // Preload script
    {
        mode: 'development',
        entry: './preload.ts',
        target: 'electron-preload',
        devtool: 'source-map',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'preload.js'
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: 'ts-loader'
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js']
        }
    }
];