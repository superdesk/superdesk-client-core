import {Locator, Page, expect} from '@playwright/test';

// The markForUser extension: its dialog, the list and editor avatars, and the "Marked for me" top bar dropdown.
export class MarkForUser {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    getDialog(): Locator {
        return this.page.getByTestId('mark-for-user-modal');
    }

    getUserSelect(): Locator {
        return this.getDialog().getByTestId('select-user-dropdown');
    }

    // the options are portaled to the end of <body>, outside the dialog
    getUserOptions(): Locator {
        return this.page.getByTestId('tree-select-popover').getByRole('treeitem');
    }

    getConfirmButton(): Locator {
        return this.getDialog().getByTestId('confirm');
    }

    getUnmarkButton(): Locator {
        return this.getDialog().getByTestId('unmark');
    }

    getCancelButton(): Locator {
        return this.getDialog().getByTestId('cancel');
    }

    getCloseIcon(): Locator {
        return this.getDialog().getByRole('button', {name: 'Close', exact: true});
    }

    // The dialog opens with the user list already expanded, and picking a user collapses it.
    async chooseUser(displayName: string): Promise<void> {
        const option = this.getUserOptions().filter({hasText: displayName});

        await expect(async () => {
            if (!await option.isVisible()) {
                await this.getUserSelect().getByTestId('open-popover').click();
            }

            await option.click({timeout: 2000});
            await expect(this.getUserSelect()).toContainText(displayName, {timeout: 2000});
        }).toPass({timeout: 10000});
    }

    // The expanded list covers the dialog's buttons; a click outside it closes it.
    async collapseUserOptions(): Promise<void> {
        const options = this.getUserOptions();

        await expect(options.first()).toBeVisible();
        await expect(async () => {
            if (await options.first().isVisible()) {
                // the title; the confirm button carries the same text further down
                await this.getDialog().getByText('Mark for user', {exact: true}).first().click();
            }

            await expect(options).toHaveCount(0, {timeout: 2000});
        }).toPass({timeout: 10000});
    }

    getListAvatar(item: Locator): Locator {
        return item.getByTestId('marked-for-user');
    }

    getEditorAvatar(): Locator {
        return this.page.getByTestId('authoring-topbar').getByTestId('marked-for-user');
    }

    getMarkedForMeButton(): Locator {
        return this.page.getByTestId('marked-for-me-dropdown').getByTestId('toggle-button');
    }

    getMarkedForMeCount(): Locator {
        return this.getMarkedForMeButton().getByTestId('badge');
    }

    getMarkedForMeItems(): Locator {
        return this.page.getByTestId('marked-for-me-dropdown').getByTestId('item');
    }

    getMarkedForMeGroups(): Locator {
        return this.page.getByTestId('marked-for-me-dropdown').getByTestId('dropdown-tree-group');
    }

    // a group's first child is its label: the item count badge followed by the desk name
    getMarkedForMeGroupLabel(group: Locator): Locator {
        return group.locator(':scope > div').first();
    }

    async openMarkedForMe(): Promise<void> {
        await this.getMarkedForMeButton().click();
        await expect(this.getMarkedForMeItems().first()).toBeVisible();
    }
}

// The avatar's own `title` is empty; the user's name sits on its content.
export async function expectAvatarOf(avatar: Locator, displayName: string): Promise<void> {
    await expect(avatar.getByTestId('user-avatar').locator('[title]')).toHaveAttribute('title', displayName);
}
