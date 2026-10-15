// The mock must be imported first: modules read the extension API instance
// from `window` at import time (see src/superdesk.ts).
import {resetSuperdeskMock} from './tests/superdesk-mock';

import {configure} from 'enzyme';
import Adapter = require('enzyme-adapter-react-16');

configure({adapter: new Adapter()});

beforeEach(() => {
    resetSuperdeskMock();
});

const specsContext = require.context('./', true, /\.spec\.(ts|tsx)$/);

specsContext.keys().forEach(specsContext);
