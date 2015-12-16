SyncedCron.add({
  name: 'Remove scrapes older than 8 hours',
  schedule: function(parser) {
    return parser.text('every 8 hours');
  },
  job: function() {
    var expirationDate = new Date();
	expirationDate.setHours(expirationDate.getHours() - 8);
	Scrapes.remove({createdAt: {$lt: expirationDate}});
  }
});

SyncedCron.start();