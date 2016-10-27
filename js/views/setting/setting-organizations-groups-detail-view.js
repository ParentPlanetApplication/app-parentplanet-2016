define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';
    var editGroup = function() {
      var goPage = function() {
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-groups-detail-edit'
        });
      }

      if(_isSuperAnim()) {
        console.log('pass check permission with SuperAdmin');
        return goPage();
      }

      var user = JSON.parse(localStorage.getItem("user"));
      var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
        query: function(){
          return new Parse.Query(this.className);
        }
      });
      var query = UserOrganizationGroupRelation.query();
      query.equalTo("organizationId", user.setting.selectedOrgId);
      query.equalTo("userId", user.id);
      query.equalTo("relation", "staff");
      query.find().then(function(results) {
        if(results.length == 0) {
          _alert('Sorry, You need permission Admin or Faculty to edit group');
        } else {
          goPage();
        }
      })
    }

    var groupAdmin = function() {
      var goPage = function() {
        $(this).addClass("bg-highlight-grey");
        setTimeout(function() {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-groupadmin'
            });
        }, DEFAULT_ANIMATION_DELAY);
      }

      if(_isSuperAnim()) {
        console.log('pass check permission with SuperAdmin');
        return goPage();
      }

      var user = JSON.parse(localStorage.getItem("user"));
      var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
        query: function(){
          return new Parse.Query(this.className);
        }
      });
      var query = UserOrganizationGroupRelation.query();
      query.equalTo("organizationId", user.setting.selectedOrgId);
      query.equalTo("userId", user.id);
      query.equalTo("relation", "staff");
      query.find().then(function(results) {
        if(results.length == 0) {
          _alert('Sorry, You need permission Admin or Faculty to see groupAdministrator');
        } else {
          goPage();
        }
      })
    }

    var showEditButton = function() {
      $('.navbar').append('<div id="editGroupBtn" class="right-menu text">Edit</div>');

      $("#editGroupBtn").on('click', function(e) {
        editGroup();
      });
    }

    var showGroupAdminButton = function() {
      var htmlItems = [
        '<div id="groupAdminBtn" class="menu-item">',
        '<div class="text-left">Group Administrators</div>',
        '<div class="icon-right">',
        '<i class="icon-right-open"></i>',
        '</div>',
        '</div>'
      ];

      $('.innerview-container').append(htmlItems.join(' '));

      $("#groupAdminBtn").on('click', function(e) {
        groupAdmin();
      }); //eo groupAdminBtn click
    }

    var showClassParentButton = function () {
        var htmlItems = [
          '<div id="groupClassParentBtn" class="menu-item">',
          '<div class="text-left">Class Parent</div>',
          '<div class="icon-right">',
          '<i class="icon-right-open"></i>',
          '</div>',
          '</div>'
        ];

        $('.innerview-container').append(htmlItems.join(' '));

        $("#groupClassParentBtn").on('click', function (e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function () {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-groupclassparent'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
    }

    var loadInfo = function(){
            var user = JSON.parse(localStorage.getItem("user"));
        var selectedOrgGroupId = user.setting.selectedOrgGroupId;
        var data = user.setting.selectedOrgGroupData;
        var permission = user.setting.permissonOfSelectedOrg;

        $("#title").html(user.setting.selectedOrgData.name + " - " + data.name);
        $("#group-name").html(data.name);
        $("#group-id").html(data.objectId);
        $("#group-label").html(data.label);
        $("#group-info").html(data.description);

        if( _isSuperAnim() || _isOrganizationAdmin()) {
          showEditButton();
          showGroupAdminButton();
          showClassParentButton();
        }
    }; //eo loadInfo

    var initEvents = function(){
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-list'
            });
        });

        /*$("#qr").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-qrcode'
            });
        });*/
        $("#studentsBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-students'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
    }; //eo initEvents

    var addedToDOM = function() {
        initEvents();
        loadInfo();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-view',
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
