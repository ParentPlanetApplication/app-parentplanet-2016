define([
    'controllers/base/controller',
    'models/setting',
    'models/user',
    'views/setting/setting-home-view',
    'views/setting/setting-user-home-view',
    'views/setting/setting-user-contactpermissions-view',
    'views/setting/setting-user-default-list-view',
    'views/setting/setting-user-access-home-view',
    'views/setting/setting-user-access-detail-view',
    'views/setting/setting-user-access-add-view',
    'views/setting/setting-user-activities-home-view',
    'views/setting/setting-user-activities-list-view',
    'views/setting/setting-user-activities-detail-view',
    'views/setting/setting-user-activities-detail-contactpermissions-view',
    'views/setting/setting-user-kids-home-view',
    'views/setting/setting-user-kids-detail-view',
    'views/setting/setting-user-kids-addnew-view',
    'views/setting/setting-add-new-activity-home-view',
    'views/setting/setting-add-new-activity-qrcode-home-view',
    'views/setting/setting-add-new-activity-qrcode-scan-view',
    'views/setting/setting-add-new-activity-entercode-view',
    'views/setting/setting-add-new-activity-done-view',
    'views/setting/setting-user-contact-info-view',
    'views/setting/setting-organizations-add-view',
    'views/setting/setting-organizations-home-view',
    'views/setting/setting-organizations-detail-view',
    'views/setting/setting-organizations-groups-list-view',
    'views/setting/setting-organizations-groups-add-view',
    'views/setting/setting-organizations-groups-detail-view',
    'views/setting/setting-organizations-groups-detail-edit-view',
    'views/setting/setting-organizations-groups-detail-students-view',
    'views/setting/setting-organizations-groups-detail-students-add-view',
    'views/setting/setting-organizations-groups-detail-students-add-byid-view',
    // 'views/setting/setting-organizations-groups-detail-students-add-byname-view',
    'views/setting/setting-organizations-groups-detail-students-add-bynameemail-view',
    'views/setting/setting-organizations-groups-detail-students-add-bynamemobile-view',
    'views/setting/setting-organizations-groups-detail-students-add-organization-view',
    'views/setting/setting-organizations-groups-detail-students-add-organization-individual-view',
    'views/setting/setting-organizations-groups-detail-qrcode-view',
    'views/setting/setting-organizations-groups-detail-groupadmin-view',
    'views/setting/setting-organizations-groups-detail-groupadmin-add-view',
    'views/setting/setting-organizations-groups-detail-groupadmin-add-fromorg-view',
    'views/setting/setting-organizations-groups-detail-groupclassparent-view',
    'views/setting/setting-organizations-groups-detail-groupclassparent-add-fromorg-view',
    'views/setting/setting-organizations-detail-qrcode-view',
    'views/setting/setting-organizations-detail-edit-view',
    'views/setting/setting-organizations-detail-staff-view',
    'views/setting/setting-organizations-detail-staff-add-view',
    'views/setting/setting-organizations-detail-staff-add-byid-view',
    'views/setting/setting-organizations-detail-staff-add-byemail-view',
    'views/setting/setting-organizations-detail-students-view',
    'views/setting/setting-organizations-detail-students-add-view',
    'views/setting/setting-organizations-detail-students-add-byid-view',
    'views/setting/setting-organizations-detail-students-add-byemail-view',
    'views/setting/setting-organizations-detail-students-add-byname-view',
    'views/setting/setting-organizations-detail-students-add-bynameemail-view',
    'views/setting/setting-organizations-detail-students-add-bynamemobile-view',
    'views/setting/privacy-view',
    'views/setting/tos-view',
    'views/setting/setting-mygroups-view',
    'views/setting/setting-mygroups-add-view',
    'views/setting/setting-mygroups-edit-view',
    'views/setting/setting-mygroups-detail-view',
    'views/setting/setting-mygroups-detail-contacts-view',
    'views/setting/setting-mygroups-detail-contacts-add-view',
    'views/setting/setting-mygroups-detail-contacts-add-byemail-view',
    'views/setting/setting-mygroups-detail-contacts-add-mobilephone-view',
    'views/setting/setting-mygroups-detail-contacts-add-byid-view',
    'views/setting/setting-mygroups-detail-groupadmin-view',

], function (Controller, Model, UserModel, SettingHomeView, UserHomeView, UserContactPermissionsView, UserDefaultListView, UserAccessHomeView, UserAccessDetailView, UserAccessAddView, UserActivitiesHomeView, UserActivitiesListView, UserActivitiesDetailView, UserActivitiesDetailContactPermissionsView, UserKidsHomeView, UserKidsDetailView, UserKidsAddNewView, AddNewActivityHomeView, AddNewActivityQrCodeHomeView, AddNewActivityQrCodeScanView, AddNewActivityEnterCodeView, AddNewActivityDoneView, UserContactInfoView, OrganizationsAddView, OrganizationsHomeView, OrganizationDetailView, OrganizationGroupsListView, OrganizationGroupsAddView, OrganizationGroupsDetailView, OrganizationGroupsDetailEditView, OrganizationGroupsDetailStudentsView, OrganizationGroupsDetailStudentsAddView, OrganizationGroupsDetailStudentsAddByIdView, /*OrganizationGroupsDetailStudentsAddByNameView, */OrganizationGroupsDetailStudentsAddByNameEmailView, OrganizationGroupsDetailStudentsAddByNameMobileView, OrganizationGroupsDetailStudentsAddOrganizationView, OrganizationGroupsDetailStudentsAddOrganizationIndividualView, OrganizationGroupsDetailQrCodeView
    , OrganizationGroupsDetailGroupAdminView, OrganizationGroupsDetailGroupAdminAddView, OrganizationGroupsDetailGroupAdminAddFromOrgView
    , OrganizationGroupsDetailGroupClassParentView, OrganizationGroupsDetailGroupClassParentAddFromOrgView
    , OrganizationDetailQrCodeView, OrganizationDetailEditView, OrganizationDetailStaffView, OrganizationDetailStaffAddView, OrganizationDetailStaffAddByIdView, OrganizationDetailStaffAddByEmailView, OrganizationDetailStudentsView, OrganizationDetailStudentsAddView, OrganizationDetailStudentsAddByIdView, OrganizationDetailStudentsAddByEmailView, OrganizationDetailStudentsAddByNameView, OrganizationDetailStudentsAddByNameEmailView, OrganizationDetailStudentsAddByNameMobileView, PrivacyView, TosView, MyGroupsView, MyGroupsAddView, MyGroupsEditView, MyGroupsDetailView, MyGroupsDetailContactsView, MyGroupsDetailContactsAddView, MyGroupsDetailContactsAddByEmailView, MyGroupsDetailContactsAddMobilePhoneView, MyGroupsDetailContactsAddByIdView, MyGroupsDetailGroupAdminView) {
    'use strict';

    var Controller = Controller.extend({

        'home': function(params) {
            this.model = new Model();
            this.view = new SettingHomeView({
                model: this.model,
                region: 'main'
            });
        },

        'user-home': function(params) {
            this.model = new Model();
            this.view = new UserHomeView({
                model: this.model,
                region: 'main'
            });
        },

        'user-contactpermissions': function(params) {
            this.model = new Model();
            this.view = new UserContactPermissionsView({
                model: this.model,
                region: 'main'
            });
        },

        'user-default-list': function(params) {
            this.model = new Model();
            this.view = new UserDefaultListView({
                model: this.model,
                region: 'main'
            });
        },

        'user-access-home': function(params) {
            this.model = new Model();
            this.view = new UserAccessHomeView({
                model: this.model,
                region: 'main'
            });
        },

        'user-access-detail': function(params) {
            this.model = new Model();
            this.view = new UserAccessDetailView({
                model: this.model,
                region: 'main'
            });
        },

        'user-access-add': function(params) {
            this.model = new Model();
            this.view = new UserAccessAddView({
                model: this.model,
                region: 'main'
            });
        },

        'user-activities-home': function(params) {
            this.model = new Model();
            this.view = new UserActivitiesHomeView({
                model: this.model,
                region: 'main'
            });
        },

        'user-activities-list': function(params) {
            this.model = new Model();
            this.view = new UserActivitiesListView({
                model: this.model,
                region: 'main'
            });
        },

        'user-activities-detail': function(params) {
            this.model = new Model();
            this.view = new UserActivitiesDetailView({
                model: this.model,
                region: 'main'
            });
        },

        'user-activities-detail-contactpermissions': function(params) {
            this.model = new Model();
            this.view = new UserActivitiesDetailContactPermissionsView({
                model: this.model,
                region: 'main'
            });
        },

        'user-kids-home': function(params) {
            this.model = new Model();
            this.view = new UserKidsHomeView({
                model: this.model,
                region: 'main'
            });
        },

        'user-kids-detail': function(params) {
            this.model = new Model();
            this.view = new UserKidsDetailView({
                model: this.model,
                region: 'main'
            });
        },

        'user-kids-addnew': function(params) {
            this.model = new Model();
            this.view = new UserKidsAddNewView({
                model: this.model,
                region: 'main'
            });
        },

        'add-new-activity-home': function(params) {
            this.model = new Model();
            this.view = new AddNewActivityHomeView({
                model: this.model,
                region: 'main'
            });
        },

        'add-new-activity-qrcode-home': function(params) {
            this.model = new Model();
            this.view = new AddNewActivityQrCodeHomeView({
                model: this.model,
                region: 'main'
            });
        },

        'add-new-activity-qrcode-scan': function(params) {
            this.model = new Model();
            this.view = new AddNewActivityQrCodeScanView({
                model: this.model,
                region: 'main'
            });
        },

        'add-new-activity-entercode': function(params) {
            this.model = new Model();
            this.view = new AddNewActivityEnterCodeView({
                model: this.model,
                region: 'main'
            });
        },

        'add-new-activity-done': function(params) {
            this.model = new Model();
            this.view = new AddNewActivityDoneView({
                model: this.model,
                region: 'main'
            });
        },

        'user-contact-info': function(params) {
            this.model = new UserModel();
            this.view = new UserContactInfoView({
                model: this.model,
                region: 'main'
            });
        },


        'organizations-add': function(params) {
            this.model = new Model();
            this.view = new OrganizationsAddView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-home': function(params) {
            this.model = new Model();
            this.view = new OrganizationsHomeView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-list': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsListView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-add': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsAddView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-edit': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailEditView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-students': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailStudentsView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-students-add': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailStudentsAddView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-students-add-byid': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailStudentsAddByIdView({
                model: this.model,
                region: 'main'
            });
        },

        // 'organizations-groups-detail-students-add-byname': function(params) {
        //     this.model = new Model();
        //     this.view = new OrganizationGroupsDetailStudentsAddByNameView({
        //         model: this.model,
        //         region: 'main'
        //     });
        // },

        'organizations-groups-detail-students-add-bynameemail': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailStudentsAddByNameEmailView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-students-add-bynamemobile': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailStudentsAddByNameMobileView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-students-add-organization': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailStudentsAddOrganizationView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-students-add-organization-individual': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailStudentsAddOrganizationIndividualView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-qrcode': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailQrCodeView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-groupadmin': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailGroupAdminView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-groupadmin-add': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailGroupAdminAddView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-groupadmin-add-fromorg': function(params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailGroupAdminAddFromOrgView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-groupclassparent': function (params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailGroupClassParentView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-groupclassparent-add': function (params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailGroupClassParentAddView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-groups-detail-groupclassparent-add-fromorg': function (params) {
            this.model = new Model();
            this.view = new OrganizationGroupsDetailGroupClassParentAddFromOrgView({
                model: this.model,
                region: 'main'
            });
        },


        'organizations-detail-qrcode': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailQrCodeView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-edit': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailEditView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-staff': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStaffView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-staff-add': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStaffAddView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-staff-add-byid': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStaffAddByIdView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-staff-add-byemail': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStaffAddByEmailView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-students': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStudentsView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-students-add': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStudentsAddView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-students-add-byid': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStudentsAddByIdView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-students-add-byemail': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStudentsAddByEmailView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-students-add-byname': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStudentsAddByNameView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-students-add-bynameemail': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStudentsAddByNameEmailView({
                model: this.model,
                region: 'main'
            });
        },

        'organizations-detail-students-add-bynamemobile': function(params) {
            this.model = new Model();
            this.view = new OrganizationDetailStudentsAddByNameMobileView({
                model: this.model,
                region: 'main'
            });
        },

        'privacy': function(params) {
            this.model = new Model();
            this.view = new PrivacyView({
                model: this.model,
                region: 'main'
            });
        },

        'tos': function(params) {
            this.model = new Model();
            this.view = new TosView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups': function(params) {
            this.model = new Model();
            this.view = new MyGroupsView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-add': function(params) {
            this.model = new Model();
            this.view = new MyGroupsAddView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-edit': function(params) {
            this.model = new Model();
            this.view = new MyGroupsEditView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-detail': function(params) {
            this.model = new Model();
            this.view = new MyGroupsDetailView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-detail-contacts': function(params) {
            this.model = new Model();
            this.view = new MyGroupsDetailContactsView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-detail-contacts-add': function(params) {
            this.model = new Model();
            this.view = new MyGroupsDetailContactsAddView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-detail-contacts-add-byemail': function(params) {
            this.model = new Model();
            this.view = new MyGroupsDetailContactsAddByEmailView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-detail-contacts-add-mobilephone': function(params) {
            this.model = new Model();
            this.view = new MyGroupsDetailContactsAddMobilePhoneView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-detail-contacts-add-byid': function(params) {
            this.model = new Model();
            this.view = new MyGroupsDetailContactsAddByIdView({
                model: this.model,
                region: 'main'
            });
        },

        'mygroups-detail-groupadmin': function(params) {
            this.model = new Model();
            this.view = new MyGroupsDetailGroupAdminView({
                model: this.model,
                region: 'main'
            });
        }



    });

    return Controller;
});
