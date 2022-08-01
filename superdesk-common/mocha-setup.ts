import 'jsdom-global/register';
import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

export function mochaGlobalSetup() {
    Enzyme.configure({adapter: new Adapter()});
}
