/* eslint-disable react/no-multi-comp */
import React from 'react';
import classNames from 'classnames';
import {gettext} from 'core/utils';
import {cleanHtml} from '../helpers';

interface IProps {
    limit?: number;
    html: boolean;
    item: string;
}

export function getEditorFieldCharactersCount(text: string, html?: boolean) {
    let input = text || '';

    input = html ? cleanHtml(input) : input;
    input = input.replace(/\r?\n|\r/g, '');

    return input.length;
}

export function CharacterCount(props: IProps) {
    const {limit} = props;
    const numChars = getEditorFieldCharactersCount(props.item, props.html);
    const highlightLimit = limit && numChars > limit;

    return (
        <>
            <span className={classNames('char-count', {error: highlightLimit})}>
                {gettext('characters')}
            </span>

            <span className={classNames('char-count', {error: highlightLimit})}>
                {numChars}
                {limit && (
                    <span className={classNames({error: highlightLimit})}>
                        /{limit}
                    </span>
                )}
            </span>
        </>
    );
}

/**
 * Unlike {@see CharacterCount}, this version does not use floats/margins
 * It should replace the former version when angular based authoring is removed
 * from the codebase.
 */
export function CharacterCount2(props: IProps) {
    const {limit} = props;
    const numChars = getEditorFieldCharactersCount(props.item, props.html);
    const highlightLimit = limit && numChars > limit;

    return (
        <span className={classNames('char-count-base', {error: highlightLimit})}>
            {numChars}
            {limit && (
                <span className={classNames({error: highlightLimit})}>
                    /{limit}
                </span>
            )}

            {gettext('characters')}
        </span>
    );
}
