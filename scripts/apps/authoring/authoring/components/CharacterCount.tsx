import React from 'react';
import classNames from 'classnames';
import {gettext} from 'core/utils';
import {cleanHtml} from '../helpers';

interface IProps {
    limit: number;
    html: boolean;
    item: string;
}

function getItemLength(props: IProps) {
    let input = props.item || '';

    input = props.html ? cleanHtml(input) : input;
    input = input.replace(/\r?\n|\r/g, '');

    return input.length;
}

export function CharacterCount(props: IProps) {
    const {limit} = props;
    const numChars = getItemLength(props);
    const errorExists = limit && numChars > limit;

    return (
        <>
            <span className={classNames('char-count', {error: errorExists})}>
                {gettext('characters')}
            </span>

            <span className={classNames('char-count', {error: errorExists})}>
                {numChars}
                {limit && (
                    <span className={classNames({error: errorExists})}>
                        /{limit}
                    </span>
                )}
            </span>
        </>
    );
}
