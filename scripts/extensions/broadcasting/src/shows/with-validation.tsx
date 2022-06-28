import * as React from 'react';
import {CreateValidators, IValidationResult} from '../form-validation';
import {superdesk} from '../superdesk';

const {mapObject} = superdesk.helpers;

type IValidationResults<T> = {
    [Property in keyof T]: IValidationResult;
};

interface IProps<T> {
    validators: CreateValidators<T>;
    children(
        validate: (item: T) => boolean,
        result: IValidationResults<T>,
    ): JSX.Element;
}

interface IState<T> {
    validationResult: IValidationResults<T>;
}

export class WithValidation<T> extends React.PureComponent<IProps<T>, IState<T>> {
    constructor(props: IProps<T>) {
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
