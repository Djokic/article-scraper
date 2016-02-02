Template.default.rendered = function() {
  var path = Router.current().location.get().path;
  $('nav a').removeClass('active');
  $('nav a[href="' + path + '"]').addClass('active');
}

Template.default.helpers({

});

Template.default.events({
  'click nav a': function(event) {
    var path = Router.current().location.get().path;
    $('nav a').removeClass('active');
    $(event.target).addClass('active');
  }
});
