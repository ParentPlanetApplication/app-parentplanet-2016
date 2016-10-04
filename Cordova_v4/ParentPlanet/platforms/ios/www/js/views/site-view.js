define(['gumby', 'chaplin', 'views/base/view', 'text!templates/site.hbs', 'models/site', 'toggleswitch', 'backbone.touch', 'parseproxy', 'parse', 'moment', 'animate' //We have to import this module to the project to enable hardware acceleration, otherwise all jquery animation will not be smooth at all
], function(Gumby, Chaplin, View, template, model, toggleswitch, touch, ParseProxy, Parse, moment) {
    'use strict';

    //For use with Push Notification
    _moment = moment;

    var TOGGLENAME = 'toggles'; //UI module name for Gumby init
    var SWITCHNAME = 'switch';
    var SKIPLINKNAME = 'skiplink';

    //when the DOM has been updated let gumby reinitialize UI modules
    var spinner = null;
    var addedToDOM = function(e) {
        Gumby.initialize(TOGGLENAME);
        Gumby.initialize(SKIPLINKNAME);
        $("#footer-toolbar > li").on('click', function(e) {
            $("#footer-toolbar > li").removeClass("active");
            $(this).addClass("active");
        });
        $("#home-tool").on("click", function(e) {
            if (_view.currentView != _view.HOME) {
                Chaplin.utils.redirectTo({
                    name: 'home'
                });
            }
        });
        $("#calendar-tool").on("click", function(e) {
            if (_view.currentView != _view.SCHEDULE_INDEX) {
                Chaplin.utils.redirectTo({
                    name: 'calendar'
                });
            }
        });
        $("#messages-tool").on("click", function(e) {
            if (_view.currentView != _view.MESSAGES_INDEX) {
                Chaplin.utils.redirectTo({
                    name: 'message'
                });
            }
        });
        $("#homework-tool").on("click", function(e) {
            if (_view.currentView != _view.HOMEWORK_INDEX) {
                Chaplin.utils.redirectTo({
                    name: 'homework'
                });
            }
        });
        $("#contacts-tool").on("click", function(e) {
            if (_view.currentView != _view.CONTACTS_INDEX) {
                Chaplin.utils.redirectTo({
                    name: 'contacts'
                });
            }
        });
        //sxm handle sliding alert and confirm button
        $("#sliding-alert .closebtn, #sliding-confirm .closebtn").on("click", function(e) {
            $('.slidingalert').removeClass("active");
            $('#sliding-alert').removeClass("dropdown");
            $("#alert-msg").html('');
        });

        //This is a mid-screen spinner needed for many pages
        _createSpinner('mid-spinner');
    };

    var SiteView = View.extend({
        container: 'body',
        id: 'site-container',
        regions: {
            inner: '#inner-container',
            main: '#main-container',
            foreground: '#foreground-container'
        },
        template: template,
        model: new model(),
        listen: {
            'addedToDOM': addedToDOM
        },
        initialize: function(options) {
            // The below invokes the initialize function of the base Chaplin.View class in the context of this class
            Chaplin.View.prototype.initialize.call(this, arguments);
        } //eo initialize
    }); //eo extend

    return SiteView;
});
