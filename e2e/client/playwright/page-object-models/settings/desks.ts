import {Locator, Page, expect} from '@playwright/test';
import {ContentExpiryField} from '../content-expiry';

/**
 * Desk settings (`#/settings/desks`) and the desk configuration modal.
 */
export class DeskSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get modal(): Locator {
        return this.page.getByTestId('desk-config-modal');
    }

    /**
     * `sd-wizard` keeps every step in the DOM and only shows the current one,
     * so anything the steps have in common has to be looked up per step.
     */
    get generalStep(): Locator {
        return this.modal.locator('[sd-deskedit-basic]');
    }

    get stagesStep(): Locator {
        return this.modal.locator('[sd-deskedit-stages]');
    }

    get deskContentExpiry(): ContentExpiryField {
        return new ContentExpiryField(this.generalStep);
    }

    get stageContentExpiry(): ContentExpiryField {
        return new ContentExpiryField(this.stagesStep);
    }

    async open(): Promise<void> {
        await this.page.goto('/#/settings/desks');
        await expect(this.page.getByTestId('add-new-desk')).toBeVisible();
    }

    async openEdit(deskName: string): Promise<void> {
        const row = this.page.getByTestId(`desk--${deskName}`);

        await expect(row).toBeVisible();
        await row.getByTestId('desk-actions').click();
        await row.getByTestId('desk-actions--options').getByTestId('desk-actions--edit').click();
        await expect(this.modal).toBeVisible();
    }

    /**
     * Saves the General step and closes the modal. The modal hiding does not
     * mean the PATCH landed, so wait for the response too.
     */
    async saveAndClose(): Promise<void> {
        const [response] = await Promise.all([
            this.page.waitForResponse(
                (r) => /\/desks\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PATCH',
            ),
            this.modal.getByTestId('done').click(),
        ]);

        expect(response.status()).toBe(200);
        await expect(this.modal).not.toBeVisible();
    }

    /** Saves the General step and moves the wizard on to Stages. */
    async saveAndContinueToStages(): Promise<void> {
        const [response] = await Promise.all([
            this.page.waitForResponse(
                (r) => /\/desks\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PATCH',
            ),
            this.modal.getByTestId('save-and-continue').click(),
        ]);

        expect(response.status()).toBe(200);
        await expect(this.stagesStep.getByTestId('new-stage')).toBeVisible();
    }

    getStageRow(stageName: string): Locator {
        return this.stagesStep.getByTestId(`stage--${stageName}`);
    }

    /** Selects a stage so its read-only Stage Details column renders. */
    async selectStage(stageName: string): Promise<void> {
        const row = this.getStageRow(stageName);

        await row.click();
        await expect(row).toHaveClass(/active/);
    }

    async openStageEdit(stageName: string): Promise<void> {
        const row = this.getStageRow(stageName);

        await this.selectStage(stageName);
        await row.getByTestId('stage-actions--edit').click();
        await expect(this.stagesStep.getByTestId('save-edited-stage')).toBeVisible();
    }

    async saveStage(): Promise<void> {
        const [response] = await Promise.all([
            this.page.waitForResponse(
                (r) => /\/stages\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PATCH',
            ),
            this.stagesStep.getByTestId('save-edited-stage').click(),
        ]);

        expect(response.status()).toBe(200);
        await expect(this.stagesStep.getByTestId('save-edited-stage')).toHaveCount(0);
    }

    /**
     * The read-only "Content expiry" line of the selected stage: the stage's
     * own value when it has one, the inherited desk or system default otherwise.
     */
    get stageExpirySummary(): Locator {
        return this.stagesStep.getByTestId('content-expiry-summary');
    }

    async closeModal(): Promise<void> {
        await this.modal.getByTestId('close-modal').click();
        await expect(this.modal).not.toBeVisible();
    }
}
