/* eslint-disable newline-per-chained-call */

import {element, by, browser} from "protractor";

class MasterDesks {
    previewTitle: any;
    switchToTab: (name: any) => void;
    getDesk: any;
    getStage: (desk: any, stage: any) => any;
    getItem: (desk: any, stage: any, item: any) => any;
    previewItem: (desk: any, stage: any, item: any) => void;
    editItem: (desk: any, stage: any, item: any) => void;
    getStatus: (desk: any, status: any) => any;
    getTask: (desk: any, status: any, task: any) => any;
    getRole: (desk: any, role: any) => any;
    getUser: (desk: any, role: any, user: any) => any;
    getUsersCount: (desk: any, role: any) => any;
    goToDesk: (desk: any) => void;
    editDesk: (desk: any) => void;
    toggleOnlineUsers: () => void;
    editUser: (desk: any, role: any, user: any) => void;

    constructor() {
        this.previewTitle = element(by.className('lightbox-title'));

        this.switchToTab = function(name) {
            element(by.id(name)).click();
        };

        this.getDesk = function(desk) {
            return element.all(by.repeater('desk in desks._items')).get(desk);
        };

        this.getStage = function(desk, stage) {
            return this.getDesk(desk).all(by.repeater('stage in deskStages[desk._id]')).get(stage);
        };

        this.getItem = function(desk, stage, item) {
            return this.getStage(desk, stage).all(by.className('content-item')).get(item);
        };

        this.previewItem = function(desk, stage, item) {
            this.getItem(desk, stage, item).click();
            this.getItem(desk, stage, item).element(by.className('icon-external')).click();
        };

        this.editItem = function(desk, stage, item) {
            this.getItem(desk, stage, item).click();
            this.getItem(desk, stage, item).element(by.className('icon-pencil')).click();
            // wait for editor sidebar animation
            browser.wait(() => element(by.className('auth-screen')).isDisplayed(), 200);
        };

        this.getStatus = function(desk, status) {
            return this.getDesk(desk).all(by.repeater('status in statuses')).get(status);
        };

        this.getTask = function(desk, status, task) {
            return this.getStatus(desk, status).all(by.repeater('item in items')).get(task);
        };

        this.getRole = function(desk, role) {
            return this.getDesk(desk).all(by.repeater('role in roles')).get(role);
        };

        this.getUser = function(desk, role, user) {
            return this.getRole(desk, role).all(by.repeater('item in items')).get(user);
        };

        this.getUsersCount = function(desk, role) {
            return this.getRole(desk, role).all(by.repeater('item in items')).count();
        };

        this.goToDesk = function(desk) {
            this.getDesk(desk).element(by.className('icon-external')).click();
        };

        this.editDesk = function(desk) {
            this.getDesk(desk).element(by.className('icon-dots')).click();
            this.getDesk(desk).element(by.className('icon-pencil')).click();
        };

        this.toggleOnlineUsers = function() {
            element(by.id('online_users')).click();
        };

        this.editUser = function(desk, role, user) {
            this.getUser(desk, role, user).click();
            this.getUser(desk, role, user).element(by.className('icon-pencil')).click();
        };
    }
}

export const masterDesks = new MasterDesks();
export default masterDesks;
