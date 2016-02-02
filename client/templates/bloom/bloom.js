Template.bloom.rendered = function() {
  Session.set("bloom-categories", []);
  Session.set("bloom-category", {});
  Session.set("bloom-text", "");
  Session.set("bloom-result", []);
  Session.set("bloom-count", 0);
  Session.set("bloom-completed", 0);

  var categories = Categories.find({}, {sort: {"createdAt": -1}});
  categories.observe({
    added: function (category) {
      var categories = Session.get("bloom-categories");
      categories.push(category);
      Session.set("bloom-categories", categories);
    },
    changed: function (newCategory, oldCategory) {
      var categories = Session.get("bloom-categories");
      categories.forEach(function (category) {
        if(category._id === oldCategory._id) {
          category['words'] = newCategory['words'];
        }
      });
      Session.set("bloom-categories", categories);
    },
    removed: function (removedCategory) {
      var categories = Session.get("bloom-categories");
      categories.forEach(function (category, index) {
        if(category._id === removedCategory._id) {
          categories.splice(index, 1);
        }
      });
      Session.set("bloom-categories", categories);
      Session.set("bloom-category", {});
    }
  });

  var scrape = Session.get('scraper-result');
  if(typeof scrape !== 'undefined' && scrape !== "") {
    $('.bloom__text__input').val(scrape.trim()).keyup();
  }

  var analysis = Analyzes.find({"_id": sessionId, "type": "Bloom"});
  analysis.observe({
    added: function (analysis) {
      Session.set("bloom-result", analysis.result);
      Session.set("bloom-count", analysis.count);
      Session.set("bloom-completed", analysis.completed);
    },
    changed: function (newAnalysis, oldAnalysis) {
      Session.set("bloom-result", newAnalysis.result);
      Session.set("bloom-count", newAnalysis.count);
      Session.set("bloom-completed", newAnalysis.completed);
    }
  });
}

Template.bloom.helpers({
  'categories': function() {
    var categories = Session.get("bloom-categories");
    Session.set("bloom-category", !!categories && !!categories.length ? categories[0] : {});
    return categories;
  },
  'category': function() {
    return Session.get("bloom-category");
  },
  'ready': function() {
    return (Session.get("bloom-text")!== "") ? true : false;
  },
  "progress": function() {
    var count = Session.get("bloom-count");
    var completed = Session.get("bloom-completed");
    var result = Session.get("bloom-result");
    return {
      active: (count  > 0 && completed < count) ? true : false,
      percentage: -100 + Math.floor(completed/count * 100),
      finish: (completed == count && count !== 0) ? true : false
    };
  },
  "result": function() {
    return Session.get("bloom-result");
  },
  "count": function() {
    return Session.get("bloom-count");
  },
  "completed": function() {
    return Session.get("bloom-completed");
  }
});

Template.bloom.events({
  'click .bloom__toggle-categories': function() {
    $('.bloom__categories').toggleClass('active');
  },
  'submit .bloom__categories__new': function(event) {
    event.preventDefault();
    Meteor.call('createBloomCategory', $('.bloom__categories__new__name').val());
    $('.bloom__categories__new')[0].reset();
  },
  'click .bloom__categories li[data-id]': function(event) {
    var categories = Session.get("bloom-categories");
    var category;
    categories.forEach(function (cat) {
      if($(event.target).closest('li').data('id') === cat._id) {
        category = cat;
      }
    });
    Session.set("bloom-category", category);
  },
  'click .bloom__categories__delete': function(event) {
    Meteor.call('deleteBloomCategory', $(event.target).closest('li').data('id'));
  },
  'change .bloom__category__words': function(event) {
    Meteor.call('updateBloomCategory', Session.get("bloom-category")._id, event.target.value);
  },
  'change [type="file"]': function(event) {
    var file = event.target.files[0];

    var reader = new FileReader();
    reader.onload = function(e) {
      $('.bloom__text__input').val(e.target.result).keyup();
    };
    reader.onerror = function(error){
      alert(error);
    }
    if(file.name.substr((~-file.name.lastIndexOf(".") >>> 0) + 2) === "txt") {
      reader.readAsText(file);
    }

  },
  'change, paste, keyup .bloom__text__input': function(event) {
    var text = event.target.value.trim();
    Session.set("bloom-text", text);
  },
  'submit .bloom__text': function(event) {
    event.preventDefault();
    Meteor.call('analyzeBloom', $('.bloom__text__input').val(), sessionId);
  },
  'click [name="reset"]': function() {
    Session.set("bloom-text", "");
    Session.set("bloom-result", []);
    Session.set("bloom-count", 0);
    Session.set("bloom-completed", 0);
    $(".bloom__text")[0].reset();
    Meteor.call('deleteResults', sessionId);
  }
});
