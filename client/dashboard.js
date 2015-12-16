sessionId = Random.id();
fileName = false;

Template.dashboard.rendered = function() {
  Session.set("urls", [""]);
  Session.set("result", "");
  Session.set("count", 0);
  Session.set("completed", 0);

  var scrapes = Scrapes.find({"_id": sessionId});
  scrapes.observe({
    added: function (document) {
      Session.set("result", document.result);
      Session.set("count", document.count);
      Session.set("completed", document.completed);
    },
    changed: function (newDocument, oldDocument) {
      Session.set("result", newDocument.result);
      Session.set("count", newDocument.count);
      Session.set("completed", newDocument.completed);
    }
  });
}

Template.dashboard.helpers({
  "urls": function() {
    return Session.get("urls");
  },
  "ready": function() {
    var urls = Session.get("urls");
    return (!!urls[0] &&  urls[0]!== "") ? true : false;
  },
  "progress":function() {
    var count = Session.get("count");
    var completed = Session.get("completed");
    var result = Session.get("result");
    return {
      active: (count  > 0 && completed < count) ? true : false,
      percentage: -100 + Math.floor(completed/count * 100),
      finish: (completed == count && count !== 0) ? true : false
    };
  },
  "result": function() {
    return Session.get("result");
  },
  "count": function() {
    return Session.get("count");
  },
  "completed": function() {
    return Session.get("completed");
  }
});

Template.dashboard.events({
  'submit .articles-list': function (event) {
    event.preventDefault();
    $('.progress').addClass('active');
    Meteor.call('processArticles', Session.get("urls"), sessionId);

    fileName =  $('.articles-list [type="file"]')[0].value.replace(/^.*[\\\/]/, '');
    fileName = "SCRAPE - " + (fileName !== "" ? fileName : Date.now());
  },
  'change, paste, keyup [name="urls"]': function(event) {
    var urls = event.target.value.trim().split("\n");
    Session.set("urls", urls);
  },
  'change [type="file"]': function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      $('.articles-list textarea').val(e.target.result).keyup();
    };
    reader.onerror = function(error){    
      alert(error);
    }
    reader.readAsText(file);
  },
  'click [name="save"]': function() {
    var result = Session.get("result");
    if(result.length) {
      var blob = new Blob([result], {type: "text/plain;charset=utf-8"});
      saveAs(blob, fileName);
    }
  },
  'click [name="reset"]': function() {
    Session.set("urls", [""]);
    Session.set("result", "");
    Session.set("count", 0);
    Session.set("completed", 0);
    $(".articles-list")[0].reset();
  }

});