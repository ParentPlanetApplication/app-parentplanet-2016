define([
    'chaplin',
    'views/base/view',
    'text!templates/navbar-view.hbs',
    'jquery',
    'backbone.touch'
], function(Chaplin, View, template, $, touch) {
    'use strict';

    var addedToDOM = function(){
        touch.$("#createBtn").on('click', function(){    Chaplin.utils.redirectTo({ name: 'create' });    })
    };
    var NavbarView = View.extend({
        container: '#header-container', //this is the element (selector) that contains this list (#calendargrid-wrapper)
        autoRender: true,
        tagName: 'header',
        className: 'navbar row',
        template: template, //how to construct the EventsView DOM element
        listen: {
            addedToDOM: addedToDOM
        },
    });
    return NavbarView; //return the View to the containing view or controller
});
