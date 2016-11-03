import 'vendor';
import 'core';
import 'core/tests/mocks';
import 'apps';

var testsContext = require.context('.', true, /.spec.js$/);
testsContext.keys().forEach(testsContext);
