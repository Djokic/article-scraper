SyncedCron.add({
  name: 'Remove scrapes older than 6 hours',
  schedule: function(parser) {
    return parser.text('every 6 hours');
  },
  job: function() {
    var expirationDate = new Date();
	expirationDate.setHours(expirationDate.getHours() - 6);
	Scrapes.remove({createdAt: {$lt: expirationDate}});
  Analyzes.remove({createdAt: {$lt: expirationDate}});
  }
});

SyncedCron.start();
