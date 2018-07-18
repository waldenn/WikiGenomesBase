angular
    .module('geneOverview')
    .component('geneOverview', {
        templateUrl: '/static/build/js/angular_templates/gene-overview.min.html',
        bindings: {
            data: '<',
            annotations: '<'
        },
        controller: function ($routeParams, sendToView, $location, $scope) {
            'use strict';
            var ctrl = this;
            ctrl.$onInit = function () {
            	ctrl.taxid = $routeParams.taxid;
            	ctrl.locusTag = $routeParams.locusTag;
            	ctrl.cm = ctrl.tm = ctrl.rm = ctrl.im = 0;
            	
                var url_suf = $location.path() + '/mg_mutant_view';
                sendToView.sendToView(url_suf, {
                    locusTag : ctrl.locusTag,
                    taxid : ctrl.taxid
                }).then(function(data) {
                	angular.forEach(data.data.mutants, function(x) {
                		if (x.mutation_id=='EFO_0000370') {
                			ctrl.cm++;
                		} else if (x.mutation_id=='EFO_0004021') {
                			ctrl.tm++;
                		} else if (x.mutation_id=='EFO_0004016') {
                			ctrl.im++;
                		} else if (x.mutation_id=='EFO_0004293'){
                			ctrl.rm++;
                		}
                	});
                });
                
            };
        }
    });