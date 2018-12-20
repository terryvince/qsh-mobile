const {resolve,join,basename,extname} = require('path');
const fs = require('fs');
const src = resolve(__dirname, '../src');
const root = resolve(__dirname, '../');
const htmlWebpackPlugin = require('html-webpack-plugin');
const htmlInjectionPlugin = require('html-script-injection-webpack-plugin');

let baseConfig = {
    root,
    src,
    dist: resolve(__dirname, '../dist'),
    app:'template of mutiple page',
    lang: 'zhCN',
    entry: {main: resolve(src,'main.js')},
    plugins: [],
    isProd: process.env.NODE_ENV === 'production',
    devServer: {
        clientLogLevel: 'warning',
        contentBase: join(__dirname, '../.temp'),
        compress: true,
        host: '0.0.0.0',
        port: 9000,
        progress: true,
        hot: true,
        // hotOnly:true,
        // open:true,
        historyApiFallback: true,
        stats: { colors: true, errors:true, errorDetails:true, modules:false, entrypoints:false }
    },
    title:{
        test:'template test'
    }
};

baseConfig.rules = [
    {
        test: /\.js$/,
        include: /src/,
        exclude: /node_modules|bower_components/,
        use: [{
            loader: 'babel-loader',
            options: {
                cacheDirectory: true
            }
        },
        'eslint-loader'
        ]
    },
    {
        test: /\.(ejs|html)$/,
        use: [
            {
                loader: 'html-loader',
                options: {
                    attrs: [':data-src', 'img:src'],
                    minimize: false  //压缩html
                }
            },
            {
                loader: 'ejs-html-loader',
                options: {
                    context: baseConfig,
                    season: 1,
                    episode: 9,
                    production: baseConfig.isProd
                }
            }
        ]
    },
    {
        test: /\.json$/,
        loader: 'json-loader'
    },
    {
        test: /\.xml$/,
        use: [
            'xml-loader'
        ]
    },
    {
        test: /\.(csv|tsv)$/,
        use: [
            'csv-loader'
        ]
    },
    {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
            loader: 'url-loader',
            options: {
                name: '[name].[ext]',
                outputPath: 'static/font/',
                publicPath: 'static/font/'
            }
        }
    },
    {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
            {
                loader: 'url-loader',
                options: {
                    limit: 8192,
                    name: '[name].[ext]',
                    outputPath: 'static/',
                    publicPath: 'static/'
                }
            }
        ]
    },
];

/*自动检测多入口多页面配置*/
(()=>{
    // 只src检测根目录
    let files = fs.readdirSync(src);
    let entrys=files.filter(fileName=>extname(fileName)==='.js');
    let pages = files.filter(fileName=>extname(fileName)==='.html');
    let isVue = !!files.filter(fileName=>extname(fileName)==='.vue')[0];
    let entryOb={};
    entrys.forEach((filename)=>{
        if(filename!=='main.js')
        {
            let name = basename(filename, '.js');
            entryOb[name]=resolve(src,filename);
        }
    });
    pages.forEach((filename)=>{
        let injectMode;
        if (isVue) {
            injectMode = 'body';
        } else {
            injectMode = baseConfig.isProd ? 'body': 'head';
        }
        let htmlWebpack = new htmlWebpackPlugin({
            filename: filename,
            template: resolve(src, filename),
            // hash: true, // 为静态资源生成hash值
            // minify: true,
            // xhtml: true,
            inject: injectMode //使用vue时需要等待文档加载完毕再引入，body后引入,如果html内联有script标签要注意顺序，最好放在body之后html之前
        });
        baseConfig.plugins.push(htmlWebpack);
    });
    Object.assign(baseConfig.entry,entryOb);
    baseConfig.isProd && baseConfig.plugins.push(new htmlInjectionPlugin({injectPoint:true}));
})();

module.exports = baseConfig;
