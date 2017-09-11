var gulp = require('gulp');
var $ = require('gulp-load-plugins')(); // 凡是 gulp-name 套件, 都可以不用再require
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create(); // 建立網站伺服器
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');

var envOptions = {
  string: 'env',
  default: { env: 'develop' }
}
var options = minimist(process.argv.slice(2), envOptions);
console.log(options)

//gulp-clean

gulp.task('clean', function () {
    return gulp.src(['./.tpm', './public'], {read: false})
        .pipe($.clean());
});

// jade
gulp.task('jade', function() {
  gulp.src('./source/**/*.jade') //編譯路徑, 編譯資料夾
    .pipe($.plumber()) // 程式出錯不會停止
    .pipe($.jade({
      pretty: true // html 會折疊呈現
    }))
    .pipe(gulp.dest('./public/')) // 輸出路徑, 發佈資料夾名
    .pipe(browserSync.stream())
});

// sass
gulp.task('sass', function () {
  var plugins = [
    autoprefixer({browsers: ['last 3 version', '> 5%', 'IE 8']}),
  ]; //插入 autoprefixer 套件 自動生成瀏覽器前綴詞, 陣列裏可選擇版本fixer

  return gulp.src('./source/scss/*.scss')
    .pipe($.plumber()) // 程式出錯不會停止
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    // 編譯完成 css
    .pipe($.postcss(plugins)) // css 後處理器, 與 autoprefixer 一起引入
    .pipe($.concat('all.css')) // 多支 css 檔案合併為一支
    .pipe($.if(options.env === 'production', $.minifyCss())) //壓縮 css //建立 develop或production
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream()) //自動重新整理
});

// babel 轉譯 ES6 檔案,為一般瀏覽器相容

gulp.task('babel', () =>
    gulp.src('./source/js/**/**.js')
    .pipe($.sourcemaps.init()) // 初始化 sourcemaps
    .pipe($.babel({
        presets: ['env']
    }))
    .pipe($.concat('all.js')) // 多支 js 檔案合併為一支
    .pipe($.if(options.env === 'production', $.uglify({
          compress:{
            drop_console: true
          } //把 console 除去
        })))//壓縮 js
    .pipe($.sourcemaps.write('.')) // 引用 sourcemaps
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream()) //自動重新整理
);


//bower
gulp.task('bower', function() {
  return gulp.src(mainBowerFiles())
    .pipe(gulp.dest('./.tpm/vendors'))
});

//把 .tpm/vendors 下的 js合併到 public/js
gulp.task('vendorsJs',['bower'], function () {
  return gulp.src(['./.tpm/vendors/**/**.js'])
    .pipe($.order([
      'jquery.js',
      'bootstrap.js'
    ]))
    .pipe($.concat('vendors.js'))//合併多支 js
    .pipe($.if(options.env === 'production', $.uglify())) //壓縮 js
    .pipe(gulp.dest('./public/js'))
})

// browser-sync 建立伺服器
// Static server
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
        baseDir: "./public"
    }
  });
});

// 監控 watch
gulp.task('watch', function () {
  gulp.watch('./source/**/*.jade', ['jade']); //監控路徑, 監控任務
  gulp.watch('./source/scss/*.scss', ['sass']);
  gulp.watch('./source/js/**/**.js', ['babel']);
});

// gulpSequence
gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorsJs'))

// 監控 可以不用打 gulp watch 直接輸入 gulp
 gulp.task('default', ['jade', 'sass', 'babel', 'vendorsJs', 'browser-sync', 'watch']);
