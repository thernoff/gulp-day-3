// Подключаем пакеты
var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var less = require('gulp-less');
// Предотвратите разрыв трубы, вызванный ошибками от плагинов gulp
var plumber = require('gulp-plumber');
// Отправляет сообщения в Mac Notification Center, Linux notifications (используя notify-send) или Windows >= 8 (using native toaster) 
var notify = require('gulp-notify');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var pug = require('gulp-pug');
var del = require('del');

// ********** Создаем задачи **********

// Таск для компиляции Less (2 способ)
gulp.task('less', function(done) {
    return gulp.src('./src/less/main.less')
      // Обработка ошибок: перед тем как начать обработку, сначала запустим plumber
      .pipe(
        // plumber будет обрабатывать ошибки и выводить их в консоль, 
        // причем в errorHandler вызываем notify.onError(), что по сути аналогично записи notify('message') - вывод сообщения в трей системы
        plumber({
          errorHandler: notify.onError( (err) => {
            return {
              title: 'Styles', // указываем свой title
              message: err.message
            }
          } )
        })
      )
      .pipe(
        sourcemaps.init()
      )
      // Преобразование less в css
      .pipe(less())
      // Расстановка автопрефиксов
      .pipe(
        autoprefixer({
          browsers: ['last 6 versions'], // указываем количество последних браузеров, для которых нужно раставлять автопрефиксы
          cascade: false
        })
      )
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./build/css/'))
      // метод stream точечно обновляет только одни стили, а reload обновляет всю страницу
      .pipe(browserSync.stream())
      .on('end', done);

});

/* Таск для компиляции PUG */
gulp.task('pug', function(done){
  return gulp.src('./src/pug/pages/**/*.pug')
    .pipe(
      plumber({
        errorHandler: notify.onError( (err) => {
          return {
            title: 'Compile PUG',
            message: err.message
          }
        })
      })
    )
    .pipe(
      pug({
        pretty: true // это нужно для того, чтобы код не минифицировался
      })
    )
    .pipe(gulp.dest('./build/'))
    .pipe(browserSync.stream())
    .on('end', done);
});

gulp.task('copy:js', function(done) {
  return gulp.src('./src/js/**/*.*')
    .pipe(gulp.dest('./build/js'))
    .pipe(browserSync.stream())
    .on('end', done);
});

gulp.task('copy:libs', function(done){
  return gulp.src('./src/libs/**/*.*')
    .pipe(gulp.dest('./build/libs'))
    .pipe(browserSync.stream())
    .on('end', done);
});

gulp.task('copy:img', function(done){
  return gulp.src('./src/img/**/*.*')
    .pipe(gulp.dest('./build/img'))
    .pipe(browserSync.stream())
    .on('end', done);
});

// Создаем задачу по удалению папки build
gulp.task('clean:build', function(){
  return del('./build')
});

// Создаем задачу
gulp.task('server', function (done) {
  browserSync.init({
    server: { baseDir: './build/' }
  });

  // Т.к. в папке src/pug/ могут находиться как pug файлы, так и html, то в этом случае следим за всеми (т.е. в расширении указываем *)
  //gulp.watch('src/**/*.html').on('change', browserSync.reload);
  gulp.watch('src/pug/**/*.*', gulp.series(['pug']));  

  gulp.watch('src/less/**/*.less', gulp.series(['less']));

  // Когда в src/js файлы js будут меняться, их нужно скопировать в папку build/js
  //gulp.watch('src/js/**/*.js').on('change', browserSync.reload);
  gulp.watch('src/js/**/*.js', gulp.series(['copy:js']));
  // Аналогично для файлов в папке libs (для различных библиотек)
  gulp.watch('src/libs/**/*.*', gulp.series(['copy:libs']));
  // Копирование изображений
  gulp.watch('src/img/**/*.*', gulp.series(['copy:img']));
  
  done();
});

// Создаем задачу по умолчанию
gulp.task('default', gulp.series([
  'clean:build',
  // Запускаем параллельное выполнение
  gulp.parallel(['less', 'pug', 'copy:js', 'copy:libs', 'copy:img']),
  'server'
]));