Router.configure({
    layoutTemplate: 'default'
});

Router.route('/', function () {
  this.render('scraper');
});

Router.route('/scraper', function () {
  this.render('scraper');
});

Router.route('/bloom', function () {
  this.render('bloom');
});

Router.route('/emotions', function () {
  this.render('emotions');
});
