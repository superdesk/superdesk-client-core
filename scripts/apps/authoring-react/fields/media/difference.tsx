import React from 'react';
import {IDifferenceComponentProps, IMediaConfig, IMediaValueOperational} from 'superdesk-api';
import {generatePatch} from 'core/patch';
import {getDifferenceStatistics} from '../difference-statistics';
import {gettext} from 'core/utils';
import {Alert} from 'superdesk-ui-framework/react';

type IProps = IDifferenceComponentProps<IMediaValueOperational, IMediaConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const value1 = this.props.value1 ?? [];
        const value2 = this.props.value2 ?? [];

        const stats = getDifferenceStatistics(
            value1,
            value2,
            (item) => item._id,
            (a, b) => Object.keys(generatePatch(a, b, {undefinedEqNull: true})).length === 0,
        );

        return (
            <div>
                {(() => {
                    if (stats.noChanges) {
                        return (
                            <div>
                                <Alert type="primary" size="small" margin="none">
                                    {gettext('There are no changes')}
                                </Alert>
                            </div>
                        );
                    } else {
                        return (
                            <div>
                                <Alert type="primary" size="small" margin="none">
                                    <div>
                                        <ul style={{listStyle: 'disc', paddingInlineStart: 16}}>
                                            {
                                                stats.added.length > 0 && (
                                                    <li>{gettext('{{n}} items added', {n: stats.added.length})}</li>
                                                )
                                            }

                                            {
                                                stats.removed.length > 0 && (
                                                    <li>{gettext('{{n}} items removed', {n: stats.removed.length})}</li>
                                                )
                                            }

                                            {
                                                stats.modified.length > 0 && (
                                                    <li>
                                                        {gettext('{{n}} items modified', {n: stats.modified.length})}
                                                    </li>
                                                )
                                            }

                                            {
                                                stats.reordered.length > 0 && (
                                                    <li>
                                                        {gettext('{{n}} items re-ordered', {n: stats.reordered.length})}
                                                    </li>
                                                )
                                            }
                                        </ul>
                                    </div>
                                </Alert>

                                <div>
                                    {
                                        gettext(
                                            'To see detailed differences, '
                                            + 'compare primary and secondary items visually',
                                        )
                                    }
                                </div>
                            </div>
                        );
                    }
                })()}
            </div>
        );
    }
}
