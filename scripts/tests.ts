import 'vendor';
import 'angular-mocks';
import 'core';
import 'core/tests/mocks';
import 'apps';

import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({adapter: new Adapter()});

var testsContext = require.context('.', true, /.spec.(js|jsx|ts|tsx)$/);

testsContext.keys().filter((path) => {
    /*
        Excluding anything from extensions because:
        1. Extensions contain dependencies in node_modules directories
            which contain their own tests which we don't want to run.
        2. It's probably better if extensions run units test on their own.
    */
    return path.startsWith('./extensions/') === false;
}).forEach(testsContext);
