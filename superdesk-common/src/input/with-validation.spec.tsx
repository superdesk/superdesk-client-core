import * as React from 'react';
import {describe, it} from 'mocha';
import * as assert from 'assert';
import {mount} from 'enzyme';
import {CreateValidators, WithValidation} from './with-validation';

interface IFormData {
    firstName: string;
    lastName: string;
}

function notEmptyValidator(val: string) {
    if (val.length < 1) {
        return 'value can not be empty'
    } else {
        return null;
    }
}

const validators: CreateValidators<IFormData> = {
    firstName: notEmptyValidator,
    lastName: notEmptyValidator,
};

type IProps = {};

interface IState {
    firstName: string;
    lastName: string;
}

class Form extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            firstName: '',
            lastName: '',
        };
    }

    render() {
        return (
            <WithValidation dynamic validators={validators}>
                {
                    (validate, validationResult, refs) => (
                        <div>
                            <div>
                                <label htmlFor="input-first-name">
                                    first name
                                </label>

                                <input
                                    id="input-first-name"
                                    data-test-id="input-first-name"
                                    type="text"
                                    value={this.state.firstName}
                                    onChange={(event) => {
                                        this.setState({firstName: event.target.value});
                                    }}
                                    ref={refs.firstName}
                                />

                                {
                                    validationResult.firstName != null && (
                                        <div data-test-id="error-first-name">{validationResult.firstName}</div>
                                    )
                                }
                            </div>

                            {
                                this.state.firstName.length > 0 && ( // only display last name if first name was filled
                                    <div>
                                        <label htmlFor="input-last-name">
                                            last name
                                        </label>

                                        <input
                                            id="input-last-name"
                                            data-test-id="input-last-name"
                                            type="text"
                                            value={this.state.lastName}
                                            onChange={(event) => {
                                                this.setState({lastName: event.target.value});
                                            }}
                                            ref={refs.lastName}
                                        />

                                        {
                                            validationResult.lastName != null && (
                                                <div data-test-id="error-last-name">{validationResult.lastName}</div>
                                            )
                                        }
                                    </div>
                                )
                            }

                            <button
                                type="submit"
                                onClick={() => {
                                    validate(this.state);
                                }}
                                data-test-id="submit"
                            >
                                submit
                            </button>
                        </div>
                    )
                }
            </WithValidation>
        );
    }
}

describe('input.withValidation', () => {
    it('does not show errors before validation', () => {
        const wrapper = mount(<Form />);

        assert.equal(
            wrapper.find('[data-test-id="error-first-name"]').length,
            0,
        );
    });

    it('shows errors after validation', () => {
        const wrapper = mount(<Form />);

        wrapper.find('[data-test-id="submit"]').simulate('click');

        assert.equal(
            wrapper.find('[data-test-id="error-first-name"]').length,
            1,
        );
    });

    it('only validates data for visible fields', () => {
        const wrapper = mount(<Form />);

        wrapper.find('[data-test-id="submit"]').simulate('click');

        assert.equal(
            wrapper.find('[data-test-id="error-last-name"]').length,
            0,
        );

        wrapper.find('[data-test-id="input-first-name"]').simulate('change', {target: {value: 'John'}});

        assert.equal(
            wrapper.find('[data-test-id="error-last-name"]').length,
            0,
        );

        wrapper.find('[data-test-id="submit"]').simulate('click');

        assert.equal(
            wrapper.find('[data-test-id="error-last-name"]').length,
            1,
        );
    });
});
