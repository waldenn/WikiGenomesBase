angular
    .module('interPro')
    .component('interPro', {
        templateUrl: '/static/wiki/js/angular_templates/interpro-view.html',
        bindings: {
            data: '<'
        },
        controller: function () {
            'use strict';
            var ctrl = this;
            ctrl.$onInit = function () {
            };
        }
    });