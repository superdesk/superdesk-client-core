import {
    ExpectedConditions,
    ProtractorExpectedConditions,
    browser,
    ElementArrayFinder,
    promise as wdpromise,
} from 'protractor';

interface IExpectedConditionsExtended extends ProtractorExpectedConditions {
    hasElementCount(finder: ElementArrayFinder, expectedElementCount: number): () => wdpromise.Promise<boolean>;
}

// Extended version of protractor's default expected conditions
// https://www.protractortest.org/#/api?view=ProtractorExpectedConditions
export const ECE: IExpectedConditionsExtended = {
    // default:
    not: ExpectedConditions.not.bind(ExpectedConditions),
    and: ExpectedConditions.and.bind(ExpectedConditions),
    or: ExpectedConditions.or.bind(ExpectedConditions),
    alertIsPresent: ExpectedConditions.alertIsPresent.bind(ExpectedConditions),
    elementToBeClickable: ExpectedConditions.elementToBeClickable.bind(ExpectedConditions),
    textToBePresentInElement: ExpectedConditions.textToBePresentInElement.bind(ExpectedConditions),
    textToBePresentInElementValue: ExpectedConditions.textToBePresentInElementValue.bind(ExpectedConditions),
    titleContains: ExpectedConditions.titleContains.bind(ExpectedConditions),
    titleIs: ExpectedConditions.titleIs.bind(ExpectedConditions),
    urlContains: ExpectedConditions.urlContains.bind(ExpectedConditions),
    urlIs: ExpectedConditions.urlIs.bind(ExpectedConditions),
    presenceOf: ExpectedConditions.presenceOf.bind(ExpectedConditions),
    stalenessOf: ExpectedConditions.stalenessOf.bind(ExpectedConditions),
    visibilityOf: ExpectedConditions.visibilityOf.bind(ExpectedConditions),
    invisibilityOf: ExpectedConditions.invisibilityOf.bind(ExpectedConditions),
    elementToBeSelected: ExpectedConditions.elementToBeSelected.bind(ExpectedConditions),
    logicalChain_: ExpectedConditions.logicalChain_.bind(ExpectedConditions),
    browser: browser,

    // custom:
    hasElementCount: (finder, expectedElementCount) => {
        return () => finder.count().then((count) => count === expectedElementCount);
    },
};
