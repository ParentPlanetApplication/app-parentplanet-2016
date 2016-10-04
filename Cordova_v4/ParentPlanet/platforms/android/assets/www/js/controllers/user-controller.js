define([
    'controllers/base/controller',
    'models/user',
    'views/user/signin-view',
    'views/user/signup-view',
    'views/user/signup-if-match-view',
    'views/user/signup-enter-user-info-view',
    'views/user/signup-enter-kid-info-view',
    'views/user/signup-children-activity-view',
    'views/user/after-register-view',
], function(
    Controller
    , UserModel
    , SignInView
    , SignUpFormView
    , SignUpIfMatchView
    , SignUpEnterUserInfoView
    , SignUpEnterKidInfoView
    , SignUpChildrenActivityView
    , AfterRegisterView
    ) {
    'use strict';
    
    var UserController = Controller.extend({

        beforeAction: function() {
            // Create a new Cars collection or preserve the existing.
            // This prevents the Cars collection from being disposed
            // in order to share it between controller actions.
            Controller.prototype.beforeAction();  //if we dont put this line here, there will be an error thrown
        },

        signin: function(params) {
            this.model = new UserModel();
            this.view = new SignInView({
                model: this.model,
                region: 'inner'
            });
        },

        signup: function(params) {
            this.model = new UserModel();
            this.view = new SignUpFormView({
                model: this.model,
                region: 'inner'
            });
        },

        'signup-if-match': function() {
            this.model = new UserModel();
            this.view = new SignUpIfMatchView({
                model: this.model,
                region: 'inner'
            });
        },

        'signup-enter-user-info': function() {
            this.model = new UserModel();
            this.view = new SignUpEnterUserInfoView({
                model: this.model,
                region: 'inner'
            });
        },

        'signup-enter-kid-info': function() {
            this.model = new UserModel();
            this.view = new SignUpEnterKidInfoView({
                model: this.model,
                region: 'inner'
            });
        },

        'children-activity-management': function(){
            this.model = new UserModel();
            this.view = new SignUpChildrenActivityView({
                model: this.model,
                region: 'inner'
            });
        },

        'after-register': function(){
            this.model = new UserModel();
            this.view = new AfterRegisterView({
                model: this.model,
                region: 'inner'
            });
        },

        signout: function(params) {
            //this.view = new UserSignOut();
        }

    });

    return UserController;
});

