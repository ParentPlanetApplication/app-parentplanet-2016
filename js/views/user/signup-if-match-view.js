define(
    [     
        'chaplin',
        'views/base/view',
        'text!templates/user/signup-if-match.hbs',
        'jquery'
    ],
    function(Chaplin, View, Template, $) {
        'use strict';
        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            //When users touches 'signup' button
            $("#nextBtn, #backBtn").click(function(e){
                Chaplin.utils.redirectTo({    name: 'signin'    });
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
