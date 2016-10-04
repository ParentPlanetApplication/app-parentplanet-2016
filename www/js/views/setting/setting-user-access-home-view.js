define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-access-home-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var user;
    var spinner;
    var userAcctAccessArray;
    function initData() {    user = _getUserData();    };
    function initButtonEvents() {
        $("#backBtn").on('click', function(e) {    Chaplin.utils.redirectTo({    name: 'setting-user-home'    });    });
        $("#createBtn").on('click', function(e) {    Chaplin.utils.redirectTo({    name: 'setting-user-access-add'    });    });
    }; //eo initButtonEvents

    var loadAcctAccess = function() {
        spinner = _createSpinner('spinner');
        var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserAcctAccess.query();
        function error(err) {
            $("#content").removeClass("hidden");
            spinner.stop();
            _alert('Error: could not add account access '+err.code+' '+err.message);
        };
        function success(results) {
            //ToDo
            var name, access;
            var email, mobile;

            function noLinkedAccess() {
                $("#content").append('<div>No user accounts given access yet</div>');
            };
            function hasLinkedAccess() {
                userAcctAccessArray = {};
                for (var i = 0; i < results.length; i++) {
                    access = results[i];
                    userAcctAccessArray[access.id] = access;
                    email = access.get("givenAccessUserEmail");
                    mobile = access.get("givenAccessUserMobilePhone");
                    name =  email ? email : mobile;
                    $("#content").append('<div id="'+access.id+'" class="nameEmailBtn menu-item"><div class="text-left">'+name+'</div><div class="icon-right"><i class="icon-right-open"></i></div></div>');
                }
                $(".nameEmailBtn").on('click', function(e) {
                    var id = e.currentTarget.id || null;
                    _selectedUserAcctAccess = id ? userAcctAccessArray[id] : null;
                    $(this).addClass("bg-highlight-grey");
                    setTimeout(function() {
                        Chaplin.utils.redirectTo({    name: 'setting-user-access-detail'    });
                    }, DEFAULT_ANIMATION_DELAY);
                }); //button link must be added after content appended
            }; //eo hasLinkedAccess
            results.length > 0 ? hasLinkedAccess() : noLinkedAccess();
            $("#content").removeClass("hidden");
            spinner.stop();
        }; //eo success
        query.equalTo("parentId", user.id);
        query.ascending("givenAccessUserEmail");
        query.find({success:success, error: error}); //eo query.find
    }; //eo loadAcctAccess

    var addedToDOM = function() {

        initData();
        initButtonEvents();
        loadAcctAccess();
        spinner.stop();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-user-access-home-view',
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
