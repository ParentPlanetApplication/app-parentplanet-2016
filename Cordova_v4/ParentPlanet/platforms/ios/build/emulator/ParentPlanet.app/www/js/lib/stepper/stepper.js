define(['jquery'], function($) {
    'use strict';

    (function($) {
        $.fn.stepper = function() {
            this.each(function() {
                var el = $(this);
                var minVal = parseInt(el.attr('min')) || -Infinity;
                var maxVal = parseInt(el.attr('max')) || Infinity;
                var stepVal = parseInt(el.attr('step')) || 1;
                // add elements
                el.wrap('<span class="spinner"></span>');     
                el.before('<span class="sub">-</span>');
                el.after('<span class="add">+</span>');

                // substract
                el.parent().on('click', '.sub', function () {
                    if (el.val() > minVal)
                    el.val( function(i, oldval) { 
                        var newVal = +oldval - stepVal;
                        newVal = newVal < minVal ? oldval : newVal;
                        return newVal; 
                    }); //eo .val fcn
                }); //eo subtract

                // increment
                el.parent().on('click', '.add', function () {
                    if (el.val() < maxVal)
                        el.val( function(i, oldval) { 
                            var newVal = +oldval + stepVal;
                            newVal = newVal > maxVal ? oldval : newVal;
                            return newVal; 
                        });
                }); //eo add

            }); //eo this.each

        }; //eo stepper
    })($);

});