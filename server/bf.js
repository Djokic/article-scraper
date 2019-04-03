Meteor.methods({
	createBfCategory: function(categoryName) {
		Categories.upsert({"name": categoryName }, {$set: {"name": categoryName, "type": "Bf"}});
	},
	deleteBfCategory: function(categoryId) {
		Categories.remove({"_id": categoryId});
	},
	updateBfCategory: function(categoryId, categoryWords) {
		Categories.update({"_id": categoryId }, {$set: { "words": categoryWords }});
	},
	analyzeBf: function(text, sessionId) {
		var categories = Categories.find({"type": "Bf"}).fetch();

		text = text.toLowerCase().replace(/([a-zA-z'])([^a-zA-Z'])|([^a-zA-Z'])([a-zA-z'])/gi, '$1 $2').replace(/\s\s+/g, ' ');

		var analysis = [];

		var now = new Date();

		Analyzes.upsert({"_id": sessionId }, {$set: {"createdAt": now, "type": "Bf", "count": categories.length, "completed": 0}});

		categories.forEach(function (category, index) {
			var counterWords = 0;
			var counterOccurence = 0;
			var words = category.words.toLowerCase().split(",");

			words.forEach(function (word) {
				word = " "  + word.trim() + " ";
				var n = numberOfOccurrences(text, word);
				if(n) {
					counterWords++;
					counterOccurence += n;
				}
			});
			Analyzes.upsert({"_id": sessionId }, {$set: {"completed": index + 1}});
			analysis.push({
				name: category.name,
				number: counterOccurence
			});
		});

		var analysisTotalWords = analysis.map(function(cat) { return cat.number; }).reduce(function(a, b) { return a + b});

		analysis.forEach(function(an) {
			an.percent = Math.round((an.number / analysisTotalWords) * 10000) / 100 + "%"
		});

		function numberOfOccurrences(string, substring) {
		  var n = 0;
		  var pos = 0;
		  var l=substring.length;
		  while (true) {
		    pos = string.indexOf(substring, pos);
		    if (pos > -1) {
		      n++;
		      pos += l;
		    } else {
		      break;
		    }
		  }
		  return (n);
		}

		Analyzes.upsert({"_id": sessionId }, {$set: {"result": analysis}});
	}
});
