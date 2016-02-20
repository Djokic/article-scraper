Template.bloom.onCreated(function() {
  this.categories = new ReactiveVar;
  this.category = new ReactiveVar;
  this.text = new ReactiveVar;
  this.result = new ReactiveVar;
  this.count = new ReactiveVar;
  this.completed = new ReactiveVar;

  this.reset = function() {
    this.categories.set([]);
    this.category.set({});
    this.text.set("");
    this.result.set([]);
    this.count.set(0);
    this.completed.set(0);
  }

  this.reset();
});

Template.bloom.rendered = function() {
  var _this = Template.instance();

  var categories = Categories.find({}, {sort: {"createdAt": -1}});
  categories.observe({
    added: function (category) {
      _this.categories.set(
        _this.categories.get().concat(category)
      );

    },
    changed: function (newCategory, oldCategory) {
      var categories = _this.categories.get();
      categories.forEach(function(category) {
        if(category._id === oldCategory._id) {
          category['words'] = newCategory['words'];
        }
      });
      _this.categories.set(categories);
    },
    removed: function (removedCategory) {
      _this.categories.set(
        _this.categories.get().filter(function(category) {
          return category._id !== removedCategory._id;
        })
      )
      _this.category.set({});
    }
  });

  var scrape = Session.get('scraper-result');
  if(typeof scrape !== 'undefined' && scrape !== "") {
    $('.bloom__text__input').val(scrape.trim()).keyup();
  }

  var analysis = Analyzes.find({"_id": sessionId, "type": "Bloom"});
  analysis.observe({
    added: function (analysis) {
      _this.result.set(analysis.result)
      _this.count.set(analysis.count)
      _this.completed.set(analysis.completed)
    },
    changed: function (newAnalysis, oldAnalysis) {
      _this.result.set(newAnalysis.result)
      _this.count.set(newAnalysis.count)
      _this.completed.set(newAnalysis.completed)
    }
  });
}

Template.bloom.helpers({
  'categories': function() {
    return Template.instance().categories.get();
  },
  'category': function() {
    var categories = Template.instance().categories.get();
    var category = Template.instance().category.get();
    if(!category.name && !!categories[0]) {
      category = categories[0];
      Template.instance().category.set(category);
    }
    return category;
  },
  'ready': function() {
    return (Template.instance().text.get() !== "") ? true : false;
  },
  "progress": function() {
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
    Template.instance().category.set(
      Template.instance().categories.get().find(function(category) {
        return category._id === $(event.target).closest('li').data('id');
      })
    )
  },
  'click .bloom__categories__delete': function(event) {
    Meteor.call('deleteBloomCategory', $(event.target).closest('li').data('id'));
  },
  'change .bloom__category__words': function(event) {
    Meteor.call('updateBloomCategory', Template.instance().category.get()._id, event.target.value);
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
    Template.instance().text.set(
       event.target.value.trim()
    );
  },
  'submit .bloom__text': function(event) {
    event.preventDefault();
    Meteor.call('analyzeBloom', $('.bloom__text__input').val(), sessionId);
  },
  'click [name="reset"]': function() {
    Template.instance().reset();
    $(".bloom__text")[0].reset();
    Meteor.call('deleteResults', sessionId);
  }
});
