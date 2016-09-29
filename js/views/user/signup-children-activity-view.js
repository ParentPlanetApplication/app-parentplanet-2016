define(
    [     
        'chaplin',
        'views/base/view',
        'text!templates/user/signup-children-activity.hbs',
        'jquery',
        'spinner'
    ],
    function(Chaplin, View, Template, $, spinner) {
        'use strict';

        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            //When users touches 'signup' button
            $("#nextBtn").click(function(e){
            })
        };

        var UserView = View.extend({
            template: Template,
            autoRender: true,
            className: "user-signup",
            listen: {
              addedToDOM: addedToDOM
            },
        });

        return UserView;
      });
