const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    resolve: {
        plugins: [
            new TsconfigPathsPlugin(),
        ],
        extensions: ['.ts', '.tsx', '.js'],
        modules: [
            path.resolve(__dirname, 'node_modules'),
        ],
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader',
            },
            {
                test: /\.(png|jpg|gif)$/i,
                type: 'asset/inline',
            }
        ],
    },
    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
    },
    entry: {
        channel: './src/channel.ts',
        overlay: './src/overlay.ts',
        landing: './src/landing.ts',
    },
    output: {
        path: path.resolve(__dirname, 'out'),
        filename: '[name].js',
    },
}