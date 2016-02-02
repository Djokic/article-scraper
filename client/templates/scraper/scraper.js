sessionId = Random.id();
fileName = false;

Template.scraper.rendered = function() {
  Session.set("scraper-urls", [""]);
  Session.set("scraper-result", "");
  Session.set("scraper-count", 0);
  Session.set("scraper-completed", 0);

  var scrapes = Scrapes.find({"_id": sessionId});
  scrapes.observe({
    added: function (document) {
      Session.set("scraper-result", document.result);
      Session.set("scraper-count", document.count);
      Session.set("scraper-completed", document.completed);
    },
    changed: function (newDocument, oldDocument) {
      Session.set("scraper-result", newDocument.result);
      Session.set("scraper-count", newDocument.count);
      Session.set("scraper-completed", newDocument.completed);
    }
  });
}

Template.scraper.helpers({
  "urls": function() {
    return Session.get("scraper-urls");
  },
  "ready": function() {
    var urls = Session.get("scraper-urls");
    return (!!urls && urls.length &&  urls[0]!== "") ? true : false;
  },
  "progress":function() {
    var count = Session.get("scraper-count");
    var completed = Session.get("scraper-completed");
    var result = Session.get("scraper-result");
    return {
      active: (count  > 0 && completed < count) ? true : false,
      percentage: -100 + Math.floor(completed/count * 100),
      finish: (completed == count && count !== 0) ? true : false
    };
  },
  "result": function() {
    return Session.get("scraper-result");
  },
  "count": function() {
    return Session.get("scraper-count");
  },
  "completed": function() {
    return Session.get("scraper-completed");
  }
});

Template.scraper.events({
  'submit .scraper__list': function (event) {
    event.preventDefault();
    $('.scraper__progress').addClass('active');
    var urls = Session.get("scraper-urls");
    var regex = /^(http|https)\:\/\//i;
    urls = urls.filter(function(url) {
      return regex.test(url);
    });
    Session.set("scraper-urls", urls);
    Meteor.call('processArticles', urls, sessionId);
  },
  'change, paste, keyup [name="urls"]': function(event) {
    var urls = event.target.value.trim().split("\n");
    Session.set("scraper-urls", urls);
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
  'click [name="save"]': function() {
    var result = Session.get("scraper-result");
    if(result.length) {
      var blob = new Blob([result], {type: "text/plain;charset=utf-8"});
      saveAs(blob, fileName);
    }
  },
  'click [name="reset"]': function() {
    Session.set("scraper-urls", [""]);
    Session.set("scraper-result", "");
    Session.set("scraper-count", 0);
    Session.set("scraper-completed", 0);
    $(".scraper__list")[0].reset();
    Meteor.call('deleteResults', sessionId);
  }

});
