Template.bf.rendered = function() {
  Session.set("bf-categories", []);
  Session.set("bf-category", {});
  Session.set("bf-text", "");
  Session.set("bf-result", []);
  Session.set("bf-count", 0);
  Session.set("bf-completed", 0);

  var categories = Categories.find({"type": "Bf"}, {sort: {"createdAt": -1}});
  categories.observe({
    added: function (category) {
      var categories = Session.get("bf-categories");
      categories.push(category);
      Session.set("bf-categories", categories);
    },
    changed: function (newCategory, oldCategory) {
      var categories = Session.get("bf-categories");
      categories.forEach(function (category) {
        if(category._id === oldCategory._id) {
          category['words'] = newCategory['words'];
        }
      });
      Session.set("bf-categories", categories);
    },
    removed: function (removedCategory) {
      var categories = Session.get("bf-categories");
      categories.forEach(function (category, index) {
        if(category._id === removedCategory._id) {
          categories.splice(index, 1);
        }
      });
      Session.set("bf-categories", categories);
      Session.set("bf-category", {});
    }
  });

  var scrape = Session.get('scraper-result');
  if(typeof scrape !== 'undefined' && scrape !== "") {
    $('.bf__text__input').val(scrape.trim()).keyup();
  }

  var analysis = Analyzes.find({"_id": sessionId, "type": "Bf"});
  analysis.observe({
    added: function (analysis) {
      Session.set("bf-result", analysis.result);
      Session.set("bf-count", analysis.count);
      Session.set("bf-completed", analysis.completed);
    },
    changed: function (newAnalysis, oldAnalysis) {
      Session.set("bf-result", newAnalysis.result);
      Session.set("bf-count", newAnalysis.count);
      Session.set("bf-completed", newAnalysis.completed);
    }
  });
}

Template.bf.helpers({
  'categories': function() {
    var categories = Session.get("bf-categories");
    Session.set("bf-category", !!categories && !!categories.length ? categories[0] : {});
    return categories;
  },
  'category': function() {
    return Session.get("bf-category");
  },
  'ready': function() {
    return (Session.get("bf-text")!== "") ? true : false;
  },
  "progress": function() {
    var count = Session.get("bf-count");
    var completed = Session.get("bf-completed");
    var result = Session.get("bf-result");
    return {
      active: (count  > 0 && completed < count) ? true : false,
      percentage: -100 + Math.floor(completed/count * 100),
      finish: (completed == count && count !== 0) ? true : false
    };
  },
  "result": function() {
    return Session.get("bf-result");
  },
  "count": function() {
    return Session.get("bf-count");
  },
  "completed": function() {
    return Session.get("bf-completed");
  }
});

Template.bf.events({
  'click .bf__toggle-categories': function() {
    $('.bf__categories').toggleClass('active');
  },
  'submit .bf__categories__new': function(event) {
    event.preventDefault();
    Meteor.call('createBfCategory', $('.bf__categories__new__name').val());
    $('.bf__categories__new')[0].reset();
  },
  'click .bf__categories li[data-id]': function(event) {
    var categories = Session.get("bf-categories");
    var category;
    categories.forEach(function (cat) {
      if($(event.target).closest('li').data('id') === cat._id) {
        category = cat;
      }
    });
    Session.set("bf-category", category);
  },
  'click .bf__categories__delete': function(event) {
    Meteor.call('deleteBfCategory', $(event.target).closest('li').data('id'));
  },
  'change .bf__category__words': function(event) {
    Meteor.call('updateBfCategory', Session.get("bf-category")._id, event.target.value);
  },
  'change [type="file"]': function(event) {
    var file = event.target.files[0];

    var reader = new FileReader();
    reader.onload = function(e) {
      $('.bf__text__input').val(e.target.result).keyup();
    };
    reader.onerror = function(error){
      alert(error);
    }
    if(file.name.substr((~-file.name.lastIndexOf(".") >>> 0) + 2) === "txt") {
      reader.readAsText(file);
    }

  },
  'change, paste, keyup .bf__text__input': function(event) {
    var text = event.target.value.trim();
    Session.set("bf-text", text);
  },
  'submit .bf__text': function(event) {
    event.preventDefault();
    Meteor.call('analyzeBf', $('.bf__text__input').val(), sessionId);
  },
  'click [name="reset"]': function() {
    Session.set("bf-text", "");
    Session.set("bf-result", []);
    Session.set("bf-count", 0);
    Session.set("bf-completed", 0);
    $(".bf__text")[0].reset();
    Meteor.call('deleteResults', sessionId);
  }
});
