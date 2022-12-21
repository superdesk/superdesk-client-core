import {describe, it} from 'mocha';
import * as assert from 'assert';
import {mount} from 'enzyme';
import * as React from 'react';
import {WithPagination} from './with-pagination';
import {range} from 'lodash';

interface IPost {
    title: string;
}

// Simulate fetching delay
const TIMEOUT = 1000;

export class Paginated extends React.PureComponent {
    getItems(): Promise<{items: Array<IPost>, pageCount: number}> {
        return new Promise((resolve) => {
            setTimeout(() => {
                return resolve({items: range(1, 500).map((x) => ({title: `title ${x}`})), pageCount: 25});
            }, TIMEOUT);
        });
    }

    render() {
        return (
            <WithPagination
                getItems={() => this.getItems()}
            >
                {
                    (items) => <div>{JSON.stringify(items)}</div>
                }
            </WithPagination>
        );
    }
}

describe('with-pagination', () => {
    it('returns button1 when rendered', (done) => {
        const wrapper = mount(<Paginated />);

        setTimeout(() => {
            assert.equal(
                wrapper.update().find('[data-test-id="button1"]').length,
                2,
            );
            done();
        }, TIMEOUT + 100);
    });

    it('returns button7 after clicking forward', (done) => {
        const wrapper = mount(<Paginated />);

        setTimeout(() => {
            wrapper.update();
            wrapper.find('[data-test-id="button9"]').at(0).simulate('click');

            assert.equal(
                wrapper.find('[data-test-id="button7"]').length,
                2,
            );
            done();
        }, TIMEOUT + 100);
    });

    it('returns button8 when at 1 page before the last page', (done) => {
        const wrapper = mount(<Paginated />);

        setTimeout(() => {
            wrapper.update();
            wrapper.find('[data-test-id="button10"]').at(0).simulate('click');
            wrapper.find('[data-test-id="button2"]').at(0).simulate('click');

            assert.equal(
                wrapper.find('[data-test-id="button8"]').length,
                2,
            );
            done();
        }, TIMEOUT + 100);
    });

    it('returns button9 when at last page', (done) => {
        const wrapper = mount(<Paginated />);

        setTimeout(() => {
            wrapper.update();
            wrapper.find('[data-test-id="button10"]').at(0).simulate('click');

            assert.equal(
                wrapper.find('[data-test-id="button9"]').length,
                2,
            );
            done();
        }, TIMEOUT + 100);
    });

    it.only('scrolls to the top of the pagination container', (done) => {
        const wrapper = mount(
            <div style={{height: 1200, overflowY: 'auto'}}>
                <div style={{height: 400}} />
                <Paginated />
            </div>,
        );

        setTimeout(() => {
            wrapper.update();
            wrapper.find('[data-test-id="button10"]').at(1).simulate('click');

            assert.equal(
                wrapper.getDOMNode(),
                0,
            );
            done();
        }, TIMEOUT + 100);
    });
});
