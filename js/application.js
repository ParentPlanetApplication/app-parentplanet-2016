define([
    'chaplin',
    'jquery',
    'moment',
    'parseproxy',
    'underscore',
    'animate', //We have to import this module to the project to enable hardware acceleration, otherwise all jquery animation will not be smooth at all
    'jqueryui'
], function(Chaplin, $, moment, ParseProxy, _) {

    'use strict';

    var stringify = function(obj, replacer, indent){
        var printedObjects = [];
        var printedObjectKeys = [];
        //this function takes care of circular references and long/long objects
        function printOnceReplacer(key, value){
            if ( printedObjects.length > 500){ // browsers will not print more than 20K, I don't see the point to allow 2K.. algorithm will not be fast anyway if we have too many objects
                return 'object too long';
            }
            var printedObjIndex = false;
            printedObjects.forEach(function(obj, index){
                if(obj===value){
                    printedObjIndex = index;
                }
            });
            if ( key == ''){ //root element
                printedObjects.push(obj);
                printedObjectKeys.push("root");
                return value;
            } else if(printedObjIndex+"" != "false" && typeof(value)=="object"){
                if ( printedObjectKeys[printedObjIndex] == "root"){
                    return "(pointer to root)";
                } else {
                    return "(see " + ((!!value && !!value.constructor) ? value.constructor.name.toLowerCase()  : typeof(value)) + " with key " + printedObjectKeys[printedObjIndex] + ")";
                }
            } else {
                var qualifiedKey = key || "(empty key)";
                printedObjects.push(value);
                printedObjectKeys.push(qualifiedKey);
                if(replacer){
                    return replacer(key, value);
                }else{
                    return value;
                }
            }
        }; //eo replacer
        return JSON.stringify(obj, printOnceReplacer, indent); //now stringify with this replacer
    };

    // The application object
    var ParentPlanet = Chaplin.Application.extend({
        // Set your application name here so the document title is set to
        // “Controller title – Site title” (see Layout#adjustTitle)
        /* old shim for moment.lang date formatting
        moment.lang('en', { //customize moment formatting of calendar()
                calendar: {
                    lastDay: '[Yesterday, ]MM/DD/YYYY',
                    sameDay: '[Today, ]MM/DD/YYYY',
                    nextDay: '[Tomorrow, ] MM/DD/YYYY',
                    lastWeek: '[Last ]dddd, MM/DD/YYYY',
                    nextWeek: '[Next ]dddd, MM/DD/YYYY',
                    sameElse: 'dddd, MM/DD/YYYY'
                }
            });
        */

        initMediator: function() { //a handy-dandy data object pointer for passing things around (updates)
            Chaplin.mediator.d = null;
            this.constructor.__super__.initMediator.call(this);
        },
        title: 'ParentPlanet 0.0.9',
        shim: function() {
            moment.lang('en', { //customize moment formatting of calendar()
                calendar: {
                    lastDay: '[Yesterday, ]MM/DD',
                    sameDay: '[Today, ]MM/DD',
                    nextDay: '[Tomorrow, ] MM/DD',
                    lastWeek: '[Last ]dddd, MM/DD',
                    nextWeek: 'dddd, MM/DD',
                    sameElse: 'dddd, MM/DD'
                }
            });
        },
        beforeUnload: function(e) {
            return 'Do not reload the page!';
        },
        watchEvents: function(o) { //tell me what is going on within chaplin by a console.log of all event parameters
            var args = Array.prototype.slice.call(arguments);
            var str = 'watchEvents: ';
            _.each(args, function(v,i){
                if(i === 0) {
                    str += '--- i = '+i+' of '+args.length+' -----\n' + v;
                } else {
                    str += '\n--- i = '+i+' of '+args.length+' -----\n' + stringify(v,function(key,value){
                        return (_.contains(['el','$el','0'], key) ? 'oops: long object!' : value);
                    },2);
                }
            });
            str += '\n--------------------\n\n\n';
            console.log(str);
        },
        start: function() {
            var args = [].slice.call(arguments);
            //example of how to use the parseProxy, which only initializes itself once
            //create multiple instances anywhere you need to use it (not sure if this is correct)
            //this.parseProxy = new ParseProxy(); 
            //sxm example of using REST interface to retrieve list of user objects
            //see: https://github.com/srhyne/jQuery-Parse

            var proxy = ParseProxy;
            
            this.shim(); //application wide mods

            /*
            *
            Refactored js/application.js so that watchEvents function will log all the event arguments using a fancy json.stringify
             with a replacer. This will printout all the model/view/controller properties for each event! 
             NOTE: THIS WILL CAUSE APP RESPONSIVENESS TO DIMINISH SIGNIFICANTLY; 
             TURN OFF FOR PRODUCTION OR PRODUCTION TESTING BY COMMENTING OUT THE MEDIATOR WATCH:
            *
            */
            //Chaplin.mediator.subscribe('all', this.watchEvents);
            //$(window).on("beforeunload", this.beforeUnload);
            // You can fetch some data here and start app
            // (by calling supermethod) after that.
            Chaplin.Application.prototype.start.apply(this, args);
        }
    });

    return ParentPlanet;
});
