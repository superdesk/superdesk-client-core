import React from 'react';
import classNames from 'classnames';

import './style.scss';

interface IProps {
    flex?: boolean;
    noPadding?: boolean;
    className?: string | {[classname: string]: boolean};
    halfWidth?: boolean;
    enabled?: boolean;
    'data-test-id'?: string;
}

/**
 * @ngdoc react
 * @name Row
 * @description Component to encapsulate a component in Form row style
 */
export const Row: React.FC<IProps> = ({
    children,
    flex,
    noPadding,
    halfWidth,
    className,
    enabled,
    'data-test-id': testId,
}) => (
    enabled === false ? null : (
        <div
            data-test-id={testId}
            className={classNames(
                'form__row',
                {
                    'form__row--flex': flex === true,
                    'no-padding': noPadding === true,
                    'form__row--half-width': halfWidth === true,
                },
                className,
            )}
        >
            {children}
        </div>
    )
);
