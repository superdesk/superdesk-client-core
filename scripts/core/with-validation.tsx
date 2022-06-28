import * as React from 'react';
import {IPropsValidationHoc, IValidationResult, IValidationResults} from 'superdesk-api';
import {mapObject} from './helpers/typescript-helpers';
import {gettext} from './utils';
export function stringNotEmpty(value: string | null | undefined): IValidationResult {
    if ((value ?? '').trim().length > 0) {
        return null;
    } else {
        return gettext('field can not be empty');
    }
}

export const emptyValueError = gettext('field can not be empty');

export function greaterThanZero(value: number): IValidationResult {
    if (value > 1 !== true) {
        return gettext('value must be greater than zero');
    } else {
        return null;
    }
}

interface IState<T> {
    validationResult: IValidationResults<T>;
}

export class WithValidation<T> extends React.PureComponent<IPropsValidationHoc<T>, IState<T>> {
    constructor(props: IPropsValidationHoc<T>) {
        super(props);

        this.validate = this.validate.bind(this);

        this.state = {
            validationResult: mapObject(props.validators, () => null),
        };
    }

    private validate(item: T): boolean {
        const showBaseProperties = Object.keys(this.props.validators);

        const validationResults: IState<T>['validationResult'] = mapObject(this.props.validators, () => null);

        for (const property of showBaseProperties as Array<keyof T>) {
            const validator = this.props.validators[property];

            validationResults[property] = validator(item[property]);
        }

        this.setState({validationResult: validationResults});

        const allValid = Object.values(validationResults).every((result) => result == null);

        return allValid;
    }

    render() {
        return this.props.children(this.validate, this.state.validationResult);
    }
}
