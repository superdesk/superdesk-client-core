
const header = element(by.className('modal__header'));
const body = element(by.className('modal__body'));

module.exports = {
    header: header,
    headerText: () => header.getText(),
    body: body,
    bodyText: () => body.getText(),
};
