var read = Meteor.npmRequire('read-art');

Meteor.methods({
	processArticles: function(urls, sessionId) {
 		var parallelRequests = 8;

		var articles = {
			count: urls.length,
			urls: urls,
			started: 0,
			completed: 0,
			result: ""
		}

		var now = new Date();

		Scrapes.upsert({"_id": sessionId }, {$set: {"createdAt": now, "count": articles.count, "completed": 0}});

		var scrape = function(url) {
			if(typeof url !== 'undefined') {
				read(url, { output: 'text', timeout: 15000 }, Meteor.bindEnvironment(function(error, article) {
					articles.completed++;
					Scrapes.upsert({"_id": sessionId }, {$set: {"completed": articles.completed}});
					if(!error) {
						articles.result += " " + article.title + " " + article.content;
					}
					if(articles.completed < articles.count) {
						if(articles.started < articles.count) next();
					} else {
						articles.result = articles.result.replace(/&nbsp;+|\s+/gi, ' ').replace(/([^A-Z\s])([A-Z])/g, '$1 $2');
						Scrapes.upsert({"_id": sessionId }, {$set: {"result": articles.result}});
					}	
				}));
			}
		}

		var next = function() {
			scrape(urls[articles.started]);
			articles.started++;
		}

		for(var i = 0; i < parallelRequests; i++) {
			next();
		}
	}
});
