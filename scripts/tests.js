import 'vendor';
import 'angular-mocks';
import 'core';
import 'core/tests/mocks';
import 'apps';

import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({adapter: new Adapter()});

var testsContext = require.context('.', true, /.spec.(js|ts|tsx)$/);

testsContext.keys().forEach(testsContext);
