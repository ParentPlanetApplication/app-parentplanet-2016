define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var user;
    var groupIdArray;
    var groupNameArray;
    var groupDataArray;

    var initData = function() {
        user = _getUserData();
        if (user.setting === null) {
            user.setting = {};
            _setUserData(user);
        }
        groupIdArray = [];
        groupNameArray = [];
        groupDataArray = [];
    }; //eo initData

    var loadMyGroups = function() {
        //Get org groups
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomGroup.query();
        query.equalTo("userId", user.id);
        query.ascending("name");
        spinner = _createSpinner('spinner');
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
                } //eo else
                //Show results
                $(".upper-area").removeClass("hidden");
                $(".lower-area").removeClass("hidden");
                initSearch();
                $(".menu-item").on('click', function(e) {
                    var selectedMyGroupId = $(this).attr("id");
                    user.setting.selectedMyGroupId = selectedMyGroupId;
                    user.setting.selectedMyGroupData = groupDataArray[groupIdArray.indexOf(selectedMyGroupId)];
                    localStorage.setItem("user", JSON.stringify(user));
                    $(this).addClass("bg-highlight-grey");
                    setTimeout(function() {
                        Chaplin.utils.redirectTo({
                            name: 'setting-mygroups-detail'
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
            } //eo error
        }); //eo query.find
    }; //eo loadMyGroups

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
            }
            $(".menu-item").off(".menu-item");
            $("#content").empty();
            for (var i = 0; i < targetGroupDataArray.length; i++) {
                var group = targetGroupDataArray[i];
                $("#content").append('<div id="' + group.id + '" class="menu-item">   \
                            <div class="text-left">' + group.get("name") + '</div>  \
                            <div class="icon-right"><i class="icon-right-open"></i></div>  \
                        </div>');
            } //eo for
            $(".menu-item").on('click', function(e) {
                var selectedMyGroupId = $(this).attr("id");
                user.setting.selectedMyGroupId = selectedMyGroupId;
                user.setting.selectedMyGroupData = groupDataArray[groupIdArray.indexOf(selectedMyGroupId)];
                localStorage.setItem("user", JSON.stringify(user));
                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                    Chaplin.utils.redirectTo({
                        name: 'setting-mygroups-detail'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            }); //eo menu-item click
            $(".menu-item").eq($(".menu-item").length - 1).off("click"); //Disable click for title menu
        }; //eo doSearch

        //Init search
        $("#searchTxt").keyup(function(e) {
            switch (e.keyCode) {
                case 8: // Backspace
                    str = $("#searchTxt").val().toLowerCase();
                    $("#searchTxt").val(str.substring(0, str.length));
                    doSearch();
                break;
                case 9: doSearch(); break; // Tab
                case 13: doSearch(); break; // Enter
                case 37: doSearch(); break; // Left
                case 38: doSearch(); break; // Up
                case 39: doSearch(); break; // Right
                case 40: doSearch(); break; // Down
                default:
                    doSearch();
            } //eo switch
        }); //eo keyup
        $("#searchBtn").on('click', function() {
            doSearch();
        });
    }; //eo initSearch

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-home'    });
        });
        $("#newGroupBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-mygroups-add'    });
        });
    }; //eo initButtons

    var spinner = null;
    var addedToDOM = function() {
        //Init
        initData();
        initButtons();
        loadMyGroups();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-mygroups-view',
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
