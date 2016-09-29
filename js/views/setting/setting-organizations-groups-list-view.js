define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-list-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var user;
    var spinner = null;
    var groupIdArray;
    var groupNameArray;
    var groupDataArray;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));

        //Reset arrays
        groupIdArray = [];
        groupNameArray = [];
        groupDataArray = [];
    }

    var checkPermissions = function() {
        if (user.isAdmin || user.setting.permissonOfSelectedOrg == "faculty" || user.setting.permissonOfSelectedOrg == "admin") {
        	$("#newGroupBtn").removeClass("hidden");
            loadOrgGroups();
        } else if (user.setting.permissonOfSelectedOrg == "teacher") {
            $("#newGroupBtn").removeClass("hidden");
            loadAccessibleOrgGroups();
        } else {
            //You do not have access to any groups within organisations
            $("#content").html('<div style="text-align:center; padding:0 10px;">Permission denied</div>');
        }
    }

    var loadOrgGroups = function(selectedGroupIdArray) {
        spinner = _createSpinner('spinner');

        var selectedOrgId = user.setting.selectedOrgId;
        var selectedOrgName = user.setting.selectedOrgData.name;
        $("#title").html(selectedOrgName);

        //Get org groups
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = OrganizationGroup.query();
        query.equalTo("organizationId", selectedOrgId);
        query.ascending("name");
        if (selectedGroupIdArray) {
            if (selectedGroupIdArray.length > 0 && user.setting.permissonOfSelectedOrg != "admin") {
                query.containedIn("objectId", selectedGroupIdArray);
            }
        }
        query.find({
            success: function(results) {
                groupDataArray = results;
                $("#content").empty();
                if (results.length == 0) {
                    $("#content").html('<div style="text-align:center; padding:0 10px;">No group found</div>');
                } else {
                    for (var i = 0; i < results.length; i++) {
                        var group = results[i];
                        $("#content").append('<div id="' + group.id + '" class="menu-item">   \
                            <div class="text-left">' + group.get("name") + '</div>  \
                            <div class="icon-right"><i class="icon-right-open"></i></div>  \
                        </div>');
                        groupIdArray.push(group.id);
                        groupNameArray.push(group.get("name"));
                    } //eo for
                } //eo else results.length
                //Show results
                $(".upper-area").removeClass("hidden");
                $(".lower-area").removeClass("hidden");
                initSearch();
                //Init events
                $(".menu-item").on('click', function(e) {
                    var selectedOrgGroupId = $(this).attr("id");
                    var user = JSON.parse(localStorage.getItem("user"));
                    user.setting.selectedOrgGroupId = selectedOrgGroupId;
                    user.setting.selectedOrgGroupData = groupDataArray[groupIdArray.indexOf(selectedOrgGroupId)];
                    localStorage.setItem("user", JSON.stringify(user));
                    $(this).addClass("bg-highlight-grey");
                    setTimeout(function() {
                        Chaplin.utils.redirectTo({
                            name: 'setting-organizations-groups-detail'
                        });
                    }, DEFAULT_ANIMATION_DELAY);
                }); //eo menu-item click
                $(".menu-item").eq($(".menu-item").length - 1).off("click"); //Disable click for title menu
                spinner.stop();
            },
            error: function(error) {
                //Todo: show error message
                console.log("Could not load org groups: " + error);
                $(".upper-area").removeClass("hidden");
                $(".lower-area").removeClass("hidden");
                spinner.stop();
            }
        }); //eo query.find
    }; //eo loadOrgGroups

    var loadAccessibleOrgGroups = function() {

        spinner = _createSpinner('spinner');

        $("#title").html(selectedOrgName);
        var selectedOrgId = user.setting.selectedOrgId;
        var selectedOrgName = user.setting.selectedOrgData.name;

        //Get org groups
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("relationType", "staff");
        query.equalTo("userId", user.id);
        query.find({
            success: function(results) {
                var selectedGroupIdArray = [];
                for (var i = 0; i < results.length; i++) {
                    selectedGroupIdArray.push(results[i].get("organizationGroupId"));
                }
                loadOrgGroups(selectedGroupIdArray);
            },
            error: function(error) {
                //Todo: show error message
                console.log("Could not load groups: " + error);
                $(".upper-area").removeClass("hidden");
                $(".lower-area").removeClass("hidden");
                spinner.stop();
            }
        }); //eo query.find
    }

    var initSearch = function() {
        //Define search function
        var doSearch = function() {
            var targetGroupDataArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            for (var i = 0; i < groupNameArray.length; i++) {
                var groupName = groupNameArray[i];
                var index = groupName.toLowerCase().indexOf(str);
                if (index != -1) {
                    targetGroupDataArray.push(groupDataArray[i]);
                }
            } //eo for
            /*
			console.log(groupDataArray.length);
			console.log(targetGroupDataArray.length);*/
            $(".menu-item").off(".menu-item");
            $("#content").empty();
            var user = JSON.parse(localStorage.getItem("user"));
            if (user.isAdmin) {
                for (var i = 0; i < targetGroupDataArray.length; i++) {
                    var group = targetGroupDataArray[i];
                    $("#content").append('<div id="' + group.id + '" class="menu-item">   \
                            <div class="text-left">' + group.get("name") + '</div>  \
                            <div class="icon-right"><i class="icon-right-open"></i></div>  \
                        </div>');
                }
                $(".menu-item").on('click', function(e) {
                    var selectedOrgGroupId = $(this).attr("id");
                    var user = JSON.parse(localStorage.getItem("user"));
                    user.setting.selectedOrgGroupId = selectedOrgGroupId;
                    user.setting.selectedOrgGroupData = groupDataArray[groupIdArray.indexOf(selectedOrgGroupId)];
                    localStorage.setItem("user", JSON.stringify(user));
                    $(this).addClass("bg-highlight-grey");
                    setTimeout(function() {
                        Chaplin.utils.redirectTo({
                            name: 'setting-organizations-groups-detail'
                        });
                    }, DEFAULT_ANIMATION_DELAY);
                }); //eo menu-item click

                $(".menu-item").eq($(".menu-item").length - 1).off("click"); //Disable click for title menu
            } else {
                //Do nothing...?
            } //eo else  user.isAdmin
        }; //eo doSearch
        //Init search
        $("#searchTxt").keyup(function(e) {
            switch (e.keyCode) {
                case 8: // Backspace
                    var str = $("#searchTxt").val().toLowerCase();
                    $("#searchTxt").val(str.substring(0, str.length));
                    doSearch();
                    break;
                case 9: // Tab
                    doSearch();
                    break;
                case 13: // Enter
                    doSearch();
                    break;
                case 37: // Left
                    doSearch();
                    break;
                case 38: // Up
                    doSearch();
                    break;
                case 39: // Right
                    doSearch();
                    break;
                case 40: // Down
                    doSearch();
                    break;

                default:
                    doSearch();
            }
        }); //eo keyup
        $("#searchBtn").on('click', function() {
            doSearch();
        }); //eo searchBtn
    }; //eo initSearch

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-detail'
            });
        });
        $("#newGroupBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-add'
            });
        });
    }; //eo initButtons

    var addedToDOM = function() {

        //Init
        initData();
        initButtons();
        checkPermissions();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-list-view',
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
