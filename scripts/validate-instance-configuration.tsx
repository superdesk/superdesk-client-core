import React from 'react';
import {Modal} from 'superdesk-ui-framework';
import ng from 'core/services/ng';
import {gettext, gettextPlural} from 'core/utils';
import {showModal} from '@sourcefabric/common';
import {appConfig, authoringReactEnabledUserSelection, extensions} from 'appConfig';
import {flatMap} from 'lodash';

interface IError {
    title: string;
    content: React.ReactNode;
}

const Heading = (props: {text: string}) => (
    <h4 style={{paddingBlockEnd: 'var(--gap-1)'}}>
        {props.text}
    </h4>
);

async function getError(): Promise<IError | null> {
    const issues: Array<React.ReactNode> = [];

    const authoringHeaderComponentsFromExtensions = flatMap(
        Object.values(extensions),
        (extension) => extension.activationResult?.contributions?.authoringHeaderComponents ?? [],
    );

    if (authoringHeaderComponentsFromExtensions.length > 0 && authoringReactEnabledUserSelection === true) {
        issues.push((
            <>
                <Heading
                    text={gettext(
                        'Unsupported extension point is being used: `contributions.authoringHeaderComponents`',
                    )}
                />

                <p>
                    {gettext('You are likely running an outdated version of auto tagging extension.')}
                </p>

                <p>
                    {gettext('Update or disable incompatible extensions.')}
                </p>
            </>
        ));
    }

    const vocabularies = await ng.get('vocabularies').getAllActiveVocabularies();
    const categoriesMissing = vocabularies.find(({_id}) => _id === 'categories') == null;

    if (categoriesMissing) {
        issues.push(
            (
                <>
                    <Heading
                        text={gettext('Vocabulary with ID "categories" is required')}
                    />

                    <p>{gettext('Add it via Settings > Metadata')}</p>
                </>
            ),
        );
    }

    for (const [extensionId, extension] of Object.entries(extensions)) {
        if (appConfig.isTestEnvironment) {
            /**
             * Do not show invalid instance config messages from extensions during e2e tests.
             * Some extensions use a custom database snapshot which has correct configs, but we don't have a method yet
             * to conditionally enable extensions only for certain tests.
             */
            break;
        }

        const extensionIssues = await (
            extension.activationResult?.contributions?.getInstanceConfigurationIssues
            ?? (() => Promise.resolve([] as Array<{message: string}>))
        )();

        if (extensionIssues.length > 0) {
            issues.push(
                (
                    <>
                        <Heading
                            text={gettextPlural(
                                extensionIssues.length,
                                'Issue with extension "{{id}}":',
                                'Issues with extension "{{id}}":',
                                {
                                    id: extensionId,
                                },
                            )}
                        />

                        {
                            extensionIssues.map(({message}, i) => (
                                <p key={i}>{message}</p>
                            ))
                        }
                    </>
                ),
            );
        }
    }

    return issues.length > 0
        ? {
            title: gettext('There are issues with instance configuration'),
            content: issues.map((node, i) => (
                <React.Fragment key={i}>
                    {i !== 0 && <hr />}
                    {node}
                </React.Fragment>
            )),
        }
        : null;
}

export function maybeDisplayInvalidInstanceConfigurationMessage() {
    getError().then((error) => {
        if (error != null) {
            showModal(({closeModal}) => (
                <Modal
                    visible={true}
                    headerTemplate={(
                        <span
                            style={{background: 'red', color: 'white', padding: 4}}
                        >
                            {error.title}
                        </span>
                    )}
                    onHide={closeModal}
                >
                    {error.content}
                </Modal>
            ));
        }
    });
}
