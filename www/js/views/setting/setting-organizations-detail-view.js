define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';
    var user;
    var spinner = null;
    var initData = function() {
        user = _getUserData();
    }; //eo initData
    var loadOrganizationData = function() {
        var orgData = user.setting.selectedOrgData;
        var addressLine1 = typeof orgData.addressLine1 === 'undefined' ? "NA" : orgData.addressLine1;
        var addressLine2 = typeof orgData.addressLine2 === 'undefined' ? "" : orgData.addressLine2;
        var address;
        $("#org-title").html(orgData.name);
        $("#org-name").html(orgData.name);
        $("#org-id").html(orgData.objectId);
        $("#org-label").html(orgData.label);
        $("#org-description").html(orgData.description);
        if (addressLine1 == "NA") {
            address = orgData.city + " " + orgData.state + " " + orgData.zip;
        } else {
            address = addressLine1 + " " + addressLine2 + "<br/>" + orgData.city + " " + orgData.state + " " + orgData.zip;
        }
        $("#org-address").html(address);
        checkPermissions();
    }; //eo loadOrganizationData

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-organizations-home'    });
        });
        $("#editBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-organizations-detail-edit'    });
        });
        if (user.isAdmin) {    $("#editBtn").removeClass("hidden");    }
        $("#staffBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({    name: 'setting-organizations-detail-staff'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#studentsBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({    name: 'setting-organizations-detail-students'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#qr").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-organizations-detail-qrcode'    });
        });
        $("#groupsBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({    name: 'setting-organizations-groups-list'    });
            }, DEFAULT_ANIMATION_DELAY);

        });
    }; //eo initButtons
    var checkPermissions = function() {
        $("#staffBtn").removeClass("hidden");
        if (user.isAdmin || user.setting.permissonOfSelectedOrg == "faculty" || user.setting.permissonOfSelectedOrg == "teacher" || user.setting.permissonOfSelectedOrg == "admin") {
            $("#groupsBtn").removeClass("hidden");
        }
        if (user.isAdmin || user.setting.permissonOfSelectedOrg == "faculty" || user.setting.permissonOfSelectedOrg == "admin") {
            $("#studentsBtn").removeClass("hidden");
        }
    }; //eo checkPermissions

    var addedToDOM = function() {
        spinner = _createSpinner('spinner');
        initData();
        initButtons();
        loadOrganizationData();
        spinner.stop();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-detail-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    return View;
});
