define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-home-view.hbs',
    'jquery',
    'spinner',
    'parse'

], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';
    var user;
    var initData = function() {
        user = _getUserData();
        if(!user.setting){    user.setting = {};    }
        //Clear catch
        user.setting.permissonOfSelectedOrg = '';   //Clear permission
        _setUserData(user);
    };
    var initPermission = function() {
        user.isAdmin ? $("#addNewOrganizationBtn").removeClass("hidden") : $.noop();
    };
    var initEventButton = function() {
        $("#backBtn").on('click', function(e) {
            var previousView = _view.previousView;
            _setPreviousView();
            switch (previousView) {
                case _view.HOME:    Chaplin.utils.redirectTo({    name: 'home'    });    break;
                case _view.SCHEDULE_INDEX:    Chaplin.utils.redirectTo({    name: 'calendar'    });    break;
                case _view.MESSAGES_INDEX:    Chaplin.utils.redirectTo({    name: 'message'    });    break;
                case _view.HOMEWORK_INDEX:    Chaplin.utils.redirectTo({    name: 'homework'    });    break;
                case _view.CONTACTS_INDEX:    Chaplin.utils.redirectTo({    name: 'contacts'    });    break;
                default:    Chaplin.utils.redirectTo({    name: 'home'    });    break;
            } //eo switch
        }); //eo backBtn click
        $("#signoutBtn").on('click', function(e) {
            Parse.User.logOut();
            var username = user.username;
            var password = ''; //fix security
            user = user.isRemember ? {username: username, password: password} : {}; //kill the user object
            _setUserData(user);
            _setSignedIn(false);
            _hasNetworkConnection = true;
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({    name: 'signin'
            });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#userBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'setting-user-home'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#organizationsBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'setting-organizations-home'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#mygroupsBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'setting-mygroups'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#addNewActivityBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'setting-add-new-activity-home'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#addNewOrganizationBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'setting-organizations-add'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#privacyPolicyBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            console.log(_currentView());
            Chaplin.utils.redirectTo({    name: 'privacy'    });
            // setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'privacy'    });
            // }, DEFAULT_ANIMATION_DELAY);
        });
        $("#termsOfServiceBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'tos'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#refreshBtn").on('click', function(e) {
            spinner.show();
            var deferred = $.Deferred();
            deferred.then(function() {
                 spinner.hide();
            });
            $(this).addClass("bg-highlight-grey");
            _onBackgroundFetch(_backgroundFetchDone, true, true, Chaplin, deferred); //(callback, immediate, getAllDataSince2010)
        });
    }; //eo initBtn

    var addedToDOM = function() {
        initData();
        initPermission();
        initEventButton();
    }; //eo addedToDOM
    var __id = 'setting-home-view';
    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: __id,
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            console.log('current view:' + _view.currentView);
            // if ( _view.currentView === _view.HOME) {
              _setCurrentView(_view.SETTING_HOME_VIEW, __id);
            // }
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    return View;
});
