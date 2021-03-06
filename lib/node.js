/*global SixSpeed */
var _ = require('lodash'),
    ChildProcess = require('child_process'),
    DataStore = require('./data-store'),
    Fs = require('fs'),
    Path = require('path');

var nodeTestPath = require.resolve('./node-test');

require('./runner');

var testDir = Path.join(__dirname, '..', 'build/tests'),
    browserLog = [];

Fs.readdirSync(testDir).forEach(function(test) {
  try {
    require(Path.join(testDir, test));
  } catch (err) {
    var msg = 'Failed to load ' + test + ' ' + err;
    browserLog.push(msg);
    console.log(msg);
  }
});

var vms = {};

SixSpeed.bench({
  concurrency: 2,

  done: function() {
    var tag = process.versions.node;
    if (/^(0\.\d+)/.exec(tag)) {
      tag = RegExp.$1;
    } else if (/^(\d+\.)/.exec(tag)) {
      tag = RegExp.$1 + 'x';
    }
    DataStore.store('node', tag, process.versions.node, SixSpeed.stats);

    _.each(vms, function(vm) {
      vm.kill();
    });
  },

  runTest: function(name, type, complete) {
    var vm = vms[type];
    if (!vm) {
      vm = vms[type] = ChildProcess.fork(nodeTestPath, [type]);
    }

    vm.once('message', function(m) {
      complete(m.result);
    });
    vm.send({name: name});
  }
});
