import React from 'react';
import {mount} from 'enzyme';
import {IArticle, IContentProfile, IExposedFromAuthoring} from 'superdesk-api';
import {sdApi} from 'api';
import {ToolbarContextProvider} from '../toolbar-context';
import {ContentProfileDropdownWidget} from '../content-profile-dropdown-widget';

// `type` is a plain string: superdesk-api.d.ts says `image`/`package`, but the server stores `picture`/`composite`.
function profile(_id: string, type: string, enabled = true): IContentProfile {
    return {_id, label: _id, type, enabled} as unknown as IContentProfile;
}

function renderWith(item: Partial<IArticle>, profiles: Array<IContentProfile>) {
    spyOn(sdApi.contentProfiles, 'getAll').and.returnValue(profiles);

    const exposed = {getLatestItem: () => item as IArticle} as IExposedFromAuthoring<IArticle>;

    return mount(
        <ToolbarContextProvider exposed={exposed} authoringStorage={null}>
            <ContentProfileDropdownWidget entity={item as IArticle} />
        </ToolbarContextProvider>,
    );
}

const textProfiles = [profile('story', 'text'), profile('text', 'text')];

describe('authoring-react content profile dropdown', () => {
    it('preselects the profile the item is on', () => {
        const wrapper = renderWith({type: 'text', profile: 'story'}, textProfiles);

        expect(wrapper.find('[data-test-id="content-profile-select"]').prop('data-test-value')).toBe('story');
    });

    it('renders with no selection when the item is on a profile that is not listed', () => {
        const wrapper = renderWith({type: 'text', profile: 'a-disabled-profile'}, textProfiles);

        expect(wrapper.find('[data-test-id="content-profile-select"]').prop('data-test-value')).toBe('');
    });

    it('renders nothing for an item that has no profile, like a kill template', () => {
        const wrapper = renderWith({type: 'text'}, textProfiles);

        expect(wrapper.find('[data-test-id="content-profile-select"]').exists()).toBe(false);
    });

    it('offers only enabled text profiles', () => {
        const wrapper = renderWith(
            {type: 'text', profile: 'story'},
            [
                profile('story', 'text'),
                profile('archived-story', 'text', false),
                profile('picture', 'picture'),
            ],
        );

        const options = wrapper.find('[data-test-id="content-profile-select"] option')
            .map((option) => option.prop('value'));

        expect(options).toEqual(['', 'story']);
    });

    ['picture', 'audio', 'video', 'composite'].forEach((type) => {
        it(`renders nothing for a ${type} item, which cannot use a text profile`, () => {
            const wrapper = renderWith({type: type as IArticle['type'], profile: type}, textProfiles);

            expect(wrapper.find('[data-test-id="content-profile-select"]').exists()).toBe(false);
        });
    });

    // Like "Package Highlight 1" in the e2e `main` snapshot.
    it('preselects the profile of a composite item that is on a text profile', () => {
        const wrapper = renderWith({type: 'composite', profile: 'story'}, textProfiles);

        expect(wrapper.find('[data-test-id="content-profile-select"]').prop('data-test-value')).toBe('story');
    });

    it('preselects the profile of a preformatted item, which is text bearing', () => {
        const wrapper = renderWith({type: 'preformatted', profile: 'story'}, textProfiles);

        expect(wrapper.find('[data-test-id="content-profile-select"]').prop('data-test-value')).toBe('story');
    });
});
