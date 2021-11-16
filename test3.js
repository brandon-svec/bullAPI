const path = require('path');

const queueFactory = require(path.resolve('lib', 'queueFactory'));
const scheduler = require(path.resolve('lib', 'scheduler'));
const consumer = require(path.resolve('lib', 'consumer'));

consumer.Init(() => {});

scheduler.AddSingleJob('default', 'asdf', { a: 'apple' }, function (err) {
  console.log(err);
  console.log('done');
});
