import * as React from 'react';
import {mapObject} from '../utils';

// null means validation was successful and no errors were found
export type IValidationResult = string | null;

export type IValidatorsForType<T> = {
    [Property in keyof T]: (value: T[Property]) => IValidationResult;
};

export type IValidationResults<T> = {
    [Property in keyof T]: IValidationResult;
};

export interface IPropsValidationHoc<T> {
    validators: IValidatorsForType<T>;
    children(
        validate: (item: T) => boolean,
        result: IValidationResults<T>,
    ): JSX.Element;
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
