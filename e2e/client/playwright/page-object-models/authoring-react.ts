import {Locator, expect} from '@playwright/test';
import {Authoring} from './authoring';
import {MediaEditor} from './media-editor';

/**
 * Helpers that only apply to authoring-react. The angular-only helpers of `Authoring` (`save`,
 * `closeAndSave`, `openSendPublishPane`, ...) look for `authoring-topbar`, which authoring-react
 * does not render.
 */
export class AuthoringReact extends Authoring {
    get root(): Locator {
        return this.page.getByTestId('authoring');
    }

    /**
     * Fails when the item opened in the angular editor, which also renders `authoring`, so a
     * spec cannot pass by testing the wrong editor.
     */
    async waitUntilOpen(): Promise<void> {
        await expect(this.root.getByTestId('authoring-toolbar-1').first()).toBeVisible();
        await expect(this.page.getByTestId('authoring-topbar')).toHaveCount(0);
        await this.waitForAuthoringReactToInitialize();
    }

    get closeButton(): Locator {
        return this.root.getByTestId('close');
    }

    get saveButtonReact(): Locator {
        return this.root.getByTestId('save');
    }

    get unsavedChangesDialog(): Locator {
        return this.page.getByTestId('unsaved-changes-dialog');
    }

    /** The editable element of a field: a plain input for slugline, a Draft.js editor for most others. */
    input(fieldId: string): Locator {
        return this.fieldContainer(fieldId).getByRole('textbox');
    }

    /** Saves from the toolbar and returns the article the server answered the PATCH with. */
    async saveAndGetItem(): Promise<{[key: string]: any}> {
        return (await this.saveAndGetRequest()).response;
    }

    async closeExpectingNoPrompt(): Promise<void> {
        await this.closeButton.click();
        await expect(this.root).toHaveCount(0);
        await expect(this.unsavedChangesDialog).toHaveCount(0);
    }

    /** Widget tabs carry the widget's icon name in `data-test-value` (`macros`, `metadata`, ...). */
    widgetTab(icon: string): Locator {
        return this.page.getByTestId('widget-icon').and(this.page.locator(`[data-test-value="${icon}"]`));
    }

    /**
     * The tab toggles its widget, so it is clicked only while no widget panel is open. The panel
     * carries no widget id, so this cannot switch from one open widget to another.
     */
    async openWidgetByIcon(icon: string): Promise<Locator> {
        const panel = this.page.getByTestId('authoring-widget-panel');

        if (!await panel.isVisible()) {
            await this.widgetTab(icon).click();
        }

        await expect(panel).toBeVisible();

        return panel;
    }
}

type MediaAction = 'Edit metadata' | 'Edit image' | 'Edit crops';

/** A picture item open in authoring-react, whose image sits in the `_media_self` field. */
export class PictureAuthoringReact extends AuthoringReact {
    get mediaField(): Locator {
        return this.fieldContainer('_media_self');
    }

    get image(): Locator {
        return this.mediaField.getByTestId('media-carousel-image');
    }

    crop(name: string): Locator {
        return this.mediaField.getByTestId('image-crop').and(this.page.locator(`[data-test-value="${name}"]`))
            .locator('img');
    }

    mediaAction(name: MediaAction): Locator {
        return this.mediaField.getByRole('button', {name, exact: true});
    }

    // The actions sit on an overlay that is `display: none` until the image is hovered, and then covers the image.
    async hoverImage(): Promise<void> {
        await this.image.scrollIntoViewIfNeeded();
        await this.image.hover({force: true});
    }

    async openMediaEditor(action: MediaAction): Promise<void> {
        await this.hoverImage();
        await this.mediaAction(action).click();
        await expect(new MediaEditor(this.page).header).toBeVisible();
    }

    async closeMediaEditor(): Promise<void> {
        const mediaEditor = new MediaEditor(this.page);

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();
    }

    /** The crops sit in a collapsed toggle box whose header is its only button. */
    async toggleCrops(): Promise<void> {
        await this.mediaField.getByTestId('image-crops').getByRole('button').click();
    }
}
