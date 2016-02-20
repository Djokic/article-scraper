sessionId = Random.id();
fileName = false;

Template.scraper.onCreated(function() {
  this.urls = new ReactiveVar;
  this.result = new ReactiveVar;
  this.count = new ReactiveVar;
  this.completed = new ReactiveVar;

  this.reset = function() {
    this.urls.set([""]);
    this.result.set("");
    this.count.set(0);
    this.completed.set(0);
  }

  this.reset();
});

Template.scraper.rendered = function() {
  var _this = Template.instance();

  var scrapes = Scrapes.find({"_id": sessionId});
  scrapes.observe({
    added: function (document) {
      _this.result.set(document.result);
      _this.count.set(document.count);
      _this.completed.set(document.completed);
    },
    changed: function (newDocument, oldDocument) {
      _this.result.set(newDocument.result);
      _this.count.set(newDocument.count);
      _this.completed.set(newDocument.completed);
    }
  });
}

Template.scraper.helpers({
  "urls": function() {
    return Template.instance().urls.get();
  },
  "ready": function() {
    var urls = Template.instance().urls.get();
    return (!!urls && urls.length &&  urls[0]!== "") ? true : false;
  },
  "progress":function() {
    var count = Template.instance().count.get();
    var completed = Template.instance().completed.get();
    return {
      active: (count  > 0 && completed < count) ? true : false,
      percentage: -100 + Math.floor(completed/count * 100),
      finish: (completed == count && count !== 0) ? true : false
    };
  },
  "result": function() {
    return Template.instance().result.get();
  },
  "count": function() {
    return Template.instance().count.get();
  },
  "completed": function() {
    return Template.instance().completed.get();
  }
});

Template.scraper.events({
  'submit .scraper__list': function (event) {
    event.preventDefault();
    $('.scraper__progress').addClass('active');
    var regex = /^(http|https)\:\/\//i;
    Template.instance().urls.set(
      Template.instance().urls.get().filter(function(url) {
        return regex.test(url);
      })
    );
    Meteor.call('processArticles', Template.instance().urls.get(), sessionId);
  },
  'change, paste, keyup [name="urls"]': function(event) {
    Template.instance().urls.set(
      event.target.value.trim().split("\n")
    );
  },
  'change [type="file"]': function(event) {
    var file = event.target.files[0];

    var reader = new FileReader();
    reader.onload = function(e) {
      $('.scraper__list__input').val(e.target.result).keyup();
    };
    reader.onerror = function(error){
      alert(error);
    }

    if(file.name.substr((~-file.name.lastIndexOf(".") >>> 0) + 2) === "txt") {
      reader.readAsText(file);
      fileName =  file.name.replace(/^.*[\\\/]/, '');
      fileName = "SCRAPE - " + (fileName !== "" ? fileName : Date.now());
    }

  },
  'click [name="save"]': function(event) {
    if(Template.instance().result.get().length) {
      var blob = new Blob([Template.instance().result.get()], {type: "text/plain;charset=utf-8"});
      saveAs(blob, fileName);
    }
  },
  'click [name="reset"]': function(event) {
    Template.instance().reset();
    $(".scraper__list")[0].reset();
    Meteor.call('deleteResults', sessionId);
  }
});
