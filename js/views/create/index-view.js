define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/create/index-view.hbs',
        'jquery'
    ],
    function(Chaplin, View, Template, $) {
        'use strict';


        var user;

        var initData = function() {

            user = JSON.parse(localStorage.getItem("user"));
            if(!user.customList){
                user.customList = {};
            }

            //Clear cache
            user.customList.selectedCustomListData = null;
            //Save data locally
            localStorage.setItem("user", JSON.stringify(user)); 

            user.customList.selectedCustomListData = null;
        }

        var initButtonEvents = function() {
            //Init touch events
            $("#createEventMenu").on('click', function(e) {
                _event = {}; //sxm global event object
                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                //keep previous view as it is
                 //   _setPreviousView(); 
                    Chaplin.utils.redirectTo({
                        name: 'create-event'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            });

            $("#createMessageMenu").on('click', function(e) {
                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                 //   _setPreviousView();
                    Chaplin.utils.redirectTo({
                        name: 'create-message'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            });

            $("#createHomeworkMenu").on('click', function(e) {
                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                //    _setPreviousView();
                    Chaplin.utils.redirectTo({
                        name: 'create-homework'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            });

            $("#cancelBtn").on('click', function(e) {
                switch (_view.previousView) {
                    case _view.HOME:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'home'
                        });
                        break;

                    case _view.SCHEDULE_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'calendar'
                        });
                        break;

                    case _view.MESSAGES_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'message'
                        });
                        break;

                    case _view.HOMEWORK_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'homework'
                        });
                        break;

                    default:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'home'
                        });
                        break;
                }
            });
        }

        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {

            initData();
            initButtonEvents();

        };
        var __id = 'creation-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            container: '#main-container',
            id: __id,
            className: 'view-container',
            //containerMethod: "prepend",
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                _setCurrentView(_view.CREATION, __id);
                //Reset footer
                $("#footer-toolbar > li").removeClass("active");
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        }); //eo View.extend

        return View;
    });
