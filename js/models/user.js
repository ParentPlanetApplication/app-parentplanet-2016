define([
    'chaplin',
    'models/base/model'
], function(Chaplin, Model) {
    'use strict';
    var User = Model.extend({
        defaults: {
            signin: {
                username: 'E-Mail',
                password: 'Password',
                rememberme: 'Remember Me',
                login: 'Login',
                tryApp: 'Anonymous Login',
                newaccount: 'Create New Account',
                resetpwd: 'Reset Password'
            },
            signup: {
                //Variable(s) for sign up form
                parentmenu: 'Parent',
                teachermenu: 'Teacher/Admin',
                email: 'E-Mail',
                andor: 'and/or',
                mobile: 'Mobile Phone',
                password: 'Password',
                verifypassword: 'Verify Password',
                firstName: 'First Name',
                lastName: 'Last Name',
                //Variable(s) if match
                verifyEmail: 'That account email already exists in our system, please login or reset your password if needed.',
                parentMenu: 'Parent',
                teacherAdminMenu: 'Teacher/Admin'
            },
            afterSignup: {
                //Variable(s) after verification
                verifyInfoMsg: 'We matched the following information with ABC school. Please verify...',
                enterInfoMsg: 'Please enter the required information below...',
                firstName: 'Your First Name*',
                lastName: 'Your Last Name*',
                email: 'E-Mail',
                homePhone: 'Home Phone',
                mobilePhone: 'Mobile Phone',
                workPhone: 'Work Phone',
                addressLine1: 'Address Line 1',
                addressLine2: 'Address Line 2',
                city: 'City',
                state: 'State',
                zip: 'Zip',
                confirmChildrenMsg: 'Please confirm your children...',
                enterChildrenMsg: 'Please enter your children\'s name(s)',
                child: 'Child',
                childFirstName: 'First Name*',
                childLastName: 'Last Name*',
                title: 'Sign Up',
                nextBtn: 'Next',
                backBtn: 'Back',
                doneBtn: 'Done',
                skipBtn: 'Skip',
                addBtn: 'Add Children',
                addMoreChildrenBtn: 'Add More Children'
            },
            title: 'Sign Up',
            nextBtn: 'Next',
            backBtn: 'Back',
            doneBtn: 'Done',
            skipBtn: 'Skip'
        } //eo defaults
    }); //eo User.Model
    return User;
});
