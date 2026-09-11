// the package ships no type declarations (@types/enzyme-adapter-react-16
// does not exist for this import style in the repository root either)
declare module 'enzyme-adapter-react-16' {
    import {EnzymeAdapter} from 'enzyme';

    class Adapter extends EnzymeAdapter {}

    export = Adapter;
}
