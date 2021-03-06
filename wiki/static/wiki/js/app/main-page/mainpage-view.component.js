angular
    .module('mainPage')
    .component('mainPage', {
        controller: function ($filter,
                              $routeParams,
                              $location,
                              allOrgs,
                              wdGetEntities,
                              entrez2QID,
                              GOTerms,
                              InterPro,
                              OperonData,
                              expasyData,
                              mutantData,
                              locusTag2Pub,
                              locusTag2QID,
                              sendToView,
                              expressionTimingData,
                              hostPathogen,
                              RefSeqChrom,
                              allOrgGenes,
                              $http,
                              ECNumbers,
                              pdbData,
                              proteinSequenceData,
                              proteinMass,
                              developmentalForm,
                              appData,
                              expressionBellandData,
                              annotationSettings,
                              taxidFilter,
                              iconMap
        ) {

            // Main gene page component. Loaded when a gene is selected.  Parses the url for taxid and locus tag and uses
            // those to make API calls to wikidata.
            var ctrl = this;

            ctrl.settings = {
                product : true,
                ortholog : true,
                alignment: true,
                expression : true,
                go : true,
                localizations: true,
                operon : true,
                interpro : true,
                enzyme : true,
                mutants : true,
                hostpath : true,
                pubs : true,
                history: true,
                movie: true
            };

            annotationSettings.getSettings().then(function(response) {
                ctrl.settings = {
                    product : ctrl.settings.product && response.data["protein-view"],
                    ortholog : ctrl.settings.ortholog && response.data["ortholog-view"],
                    alignment: ctrl.settings.alignment && response.data["alignment-view"],
                    expression : ctrl.settings.expression && response.data["expression-view"],
                    go : ctrl.settings.go && response.data["function-view"],
                    localizations: ctrl.settings.localizations && response.data["localization-view"],
                    operon : ctrl.settings.operon && response.data["operon-view"],
                    interpro : ctrl.settings.interpro && response.data["interpro-view"],
                    enzyme : ctrl.settings.enzyme && response.data["enzyme-view"],
                    mutants : ctrl.settings.mutants && response.data["mutant-view"],
                    hostpath : ctrl.settings.hostpath && response.data["protein-interaction-view"],
                    pubs : ctrl.settings.pubs && response.data["related-publication-view"],
                    history: ctrl.settings.history && response.data["revision-history-view"],
                    movie: ctrl.settings.movie && response.data["movie-data-view"],
                };
            });

            // check session key
            if ($location.path().includes("authorized")) {
                console.log("Is authorized");
                $http.get("validateSession").then(function (data) {
                    console.log("Login: " + data.data.login);

                    if (!data.data.login) {
                        alert("Your session has expired!");
                        $location.path($location.path().replace("authorized/", ""));
                        return;
                    }
                });
            }

            appData.getAppData(function (data) {
                ctrl.appData = data;

                var factory = locusTag2QID;
                if (ctrl.appData.primary_identifier == "entrez"){
                    factory = entrez2QID;
                }

                factory.getQID(ctrl.currentLocusTag, ctrl.currentTaxid).then(function (data) {
                    var results = data.data.results.bindings;
                    if (results.length > 0) {
                        ctrl.currentGene.geneQID = $filter('parseQID')(results[0].gene.value);
                        if (results[0].protein) {
                            ctrl.currentGene.proteinQID = $filter('parseQID')(results[0].protein.value);
                        } else {
                            ctrl.hasprotein = false;
                            ctrl.currentGene.productType = {"id": "Q7187"};
                            ctrl.settings.product = false;
                            ctrl.settings.go = false;
                            ctrl.settings.localizations = false;
                            ctrl.settings.interpro = false;
                            ctrl.settings.enzyme = false;
                            ctrl.settings.hostpath = false;
                        }

                    } else {
                        alert(ctrl.currentLocusTag + " doesn't seem to be a gene in this genome.");
                        $location.path('/organism/' + ctrl.currentTaxid);

                    }
                }).finally(function () {
                    wdGetEntities.wdGetEntities(ctrl.currentGene.geneQID).then(function (data) {
                        var entity = data.entities[ctrl.currentGene.geneQID];

                        ctrl.currentGene.geneLabel = entity.labels.en.value;
                        if (entity.claims.P2393) {
                            ctrl.currentGene.locusTag = entity.claims.P2393[0].mainsnak.datavalue.value;
                        }
                        if (entity.claims.P1651) {
                            ctrl.currentGene.movie = entity.claims.P1651;
                        }
                        ctrl.currentGene.geneDescription = entity.descriptions.en.value;
                        if (entity.claims.P644) {
                            ctrl.currentGene.genStart = entity.claims.P644[0].mainsnak.datavalue.value;
                        }
                        if (entity.claims.P645) {
                            ctrl.currentGene.genEnd = entity.claims.P645[0].mainsnak.datavalue.value;
                        }
                        ctrl.currentGene.strand = entity.claims.P2548[0].mainsnak.datavalue.value;

                        if (entity.claims.P279) {
                            ctrl.currentGene.geneType = entity.claims.P279[0].mainsnak.datavalue.value;
                        }
                        ctrl.currentGene.geneAliases = [];
                        angular.forEach(entity.aliases.en, function (alias) {
                            if (alias.value != ctrl.currentGene.locusTag) {
                                ctrl.currentGene.geneAliases.push(alias.value);
                            }
                        });

                        if (entity.claims.P2561) {
                            ctrl.currentGene.geneSymbol = entity.claims.P2561[0].mainsnak.datavalue.value.text;
                        }

                        if (entity.claims.P351) {
                            ctrl.currentGene.entrez = entity.claims.P351[0].mainsnak.datavalue.value;
                        }

                        if (ctrl.appData.primary_identifier == "locus_tag") {
                            OperonData.getOperonDataByLocusTag(ctrl.currentGene.locusTag).then(
                                function (data) {
                                    var dataResults = data.data.results.bindings;
                                    if (dataResults.length > 0) {
                                        ctrl.annotations.operon = dataResults;
                                    } else {
                                        ctrl.annotations.operon = [];
                                    }
                                });
                        } else {
                            OperonData.getOperonDataByEntrez(ctrl.currentGene.entrez).then(
                                function (data) {
                                    var dataResults = data.data.results.bindings;
                                    if (dataResults.length > 0) {
                                        ctrl.annotations.operon = dataResults;
                                    } else {
                                        ctrl.annotations.operon = [];
                                    }
                                });
                        }

                    });

                    if (ctrl.currentGene.proteinQID) {
                        wdGetEntities.wdGetEntities(ctrl.currentGene.proteinQID).then(function (data) {

                            var entity = data.entities[ctrl.currentGene.proteinQID];
                            ctrl.currentGene.proteinLabel = entity.labels.en.value;
                            ctrl.currentGene.description = entity.descriptions.en.value;
                            ctrl.currentGene.refseqProt = entity.claims.P637[0].mainsnak.datavalue.value;
                            if (entity.claims.P279) {
                                ctrl.currentGene.productType = entity.claims.P279[0].mainsnak.datavalue.value;
                            }
                            ctrl.currentGene.proteinAliases = [];
                            angular.forEach(entity.aliases.en, function (alias) {
                                ctrl.currentGene.proteinAliases.push(alias.value);
                            });

                            // get protein sequence data used in protein view for BLAST query
                            proteinSequenceData.getSequence(ctrl.currentGene.refseqProt).then(function (data) {
                                ctrl.currentGene.sequenceProt = encodeURIComponent(data);
                            });

                            if (entity.claims.P352) {
                                ctrl.currentGene.uniprot = entity.claims.P352[0].mainsnak.datavalue.value;

                                developmentalForm.getDevelopmentalForms(ctrl.currentGene.uniprot).then(function (data) {
                                    ctrl.currentGene.developmentalForm = data.data.results.bindings[0];

                                    if (ctrl.currentGene.developmentalForm) {
                                        // strange ascii characters got appended to string (8203)
                                        var eb = ctrl.currentGene.developmentalForm.eb.value.indexOf("+") != -1 ? '+' : '';
                                        var rb = ctrl.currentGene.developmentalForm.rb.value.indexOf("+") != -1 ? '+' : '';
                                        ctrl.currentGene.developmentalForm.eb.value = eb;
                                        ctrl.currentGene.developmentalForm.rb.value = rb;
                                    }
                                });

                                // get protein mass
                                proteinMass.getMass(ctrl.currentGene.uniprot).then(function (data) {
                                    ctrl.currentGene.mass = data;
                                });

                                // get PDB data
                                pdbData.getPdbData(ctrl.currentGene.uniprot).then(function (data) {
                                    if (data.data.results.bindings.length > 0) {
                                        ctrl.currentGene.pdbIds = data.data.results.bindings;
                                    }
                                });

                                // Get InterPro Domains from Wikidata SPARQL
                                InterPro.getInterPro(ctrl.currentGene.uniprot).then(
                                    function (data) {
                                        ctrl.ipData = data;
                                        ctrl.annotations.interpro = data;
                                    });

                                hostPathogen.getHostPathogen(ctrl.currentGene.uniprot).then(
                                    function (data) {
                                        ctrl.hostpathData = data;
                                        ctrl.annotations.hostpath = data;
                                    });


                                // Get go terms and EC numbers from WIKIDATA SPARQL
                                GOTerms.getGoTerms(ctrl.currentGene.uniprot).then(function (data) {

                                    ctrl.annotations.go = {
                                        cellcomp: [],
                                        bioproc: [],
                                        molfunc: []
                                    };
                                    ctrl.annotations.reaction = {};
                                    ctrl.mf = 'mf_button';
                                    ctrl.bp = 'bp_button';
                                    ctrl.cc = 'cc_button';

                                    var dataResults = data.data.results.bindings;

                                    // classify go terms
                                    angular.forEach(dataResults, function (value, key) {

                                        if (value.goclass.value === 'http://www.wikidata.org/entity/Q5058355') {
                                            ctrl.annotations.go.cellcomp.push(value);

                                        }
                                        if (value.goclass.value === 'http://www.wikidata.org/entity/Q14860489') {
                                            ctrl.annotations.go.molfunc.push(value);

                                        }
                                        if (value.goclass.value === 'http://www.wikidata.org/entity/Q2996394') {
                                            ctrl.annotations.go.bioproc.push(value);
                                        }

                                    });

                                });

                                ECNumbers.getECNumbers(ctrl.currentGene.uniprot).then(function (data) {
                                    var dataResults = data.data.results.bindings;
                                    angular.forEach(dataResults, function (value) {
                                        if (value.hasOwnProperty('ecnumber') && ctrl.annotations.ecnumber.indexOf(value.ecnumber.value) == -1 &&
                                            value.ecnumber.value.indexOf('-') == -1) {
                                            ctrl.annotations.ecnumber.push(value.ecnumber.value);
                                        }
                                    });
                                }).finally(function () {

                                    // now update enzyme data from ec numbers
                                    angular.forEach(ctrl.annotations.ecnumber, function (value) {
                                        expasyData.getReactionData(value).then(function (data) {
                                            console.log(data);
                                            ctrl.annotations.reaction[data.ecnumber] = data.reaction;
                                        });
                                    });

                                    var annotation_keys = {
                                        locusTag: ctrl.currentGene.locusTag,
                                        taxid: ctrl.currentGene.taxid,
                                        ec_number: ctrl.annotations.ecnumber
                                    };
                                    ctrl.getServerAnnotationData(annotation_keys);
                                });
                            }
                        });
                    }

                    // Get chromosome refseq id
                    if (ctrl.appData.primary_identifier == "locus_tag") {
                        RefSeqChrom.getRefSeqChromByLocusTag(ctrl.currentLocusTag).then(function (data) {

                            if (data[0]) {
                                ctrl.currentGene.refseqGenome = data[0].refSeqChromosome.value;
                            }

                        });
                    } else {
                        RefSeqChrom.getRefSeqChromByEntrez(ctrl.currentGene.entrez).then(function (data) {

                            if (data[0]) {
                                ctrl.currentGene.refseqGenome = data[0].refSeqChromosome.value;
                            }

                        });
                    }

                    expressionTimingData.getExpression(function (data) {
                        ctrl.expression = data;
                        var current = $filter('keywordFilter')(data, ctrl.currentLocusTag);
                        ctrl.currentExpression = {};
                        angular.forEach(current[0], function (value, key) {
                            if (key != '_id' && key != '$oid' && key != 'timestamp') {
                                ctrl.currentExpression[key] = value;
                            }
                        });
                        ctrl.annotations.expression = ctrl.currentExpression;
                    });

                    expressionBellandData.getExpression(function (data) {
                        if (data[ctrl.currentLocusTag]) {
                            ctrl.currentGene.expression = data[ctrl.currentLocusTag];
                        }
                    });

                    // Get related publications from eutils
                    var locus_tag = ctrl.currentGene.locusTag.replace('_', '');
                    locusTag2Pub.getlocusTag2Pub(locus_tag).then(function (data) {
                        ctrl.annotations.pubList = data.data.resultList.result;
                    });

                });
            });

            ctrl.$onInit = function () {
                'use strict';
                ctrl.currentTaxid = $routeParams.taxid;
                ctrl.currentLocusTag = $routeParams.locusTag;
                ctrl.currentGene = {
                    locusTag: ctrl.currentLocusTag,
                    taxid: ctrl.currentTaxid
                };
                ctrl.annotations = {
                    ecnumber: []
                };

                taxidFilter.name(ctrl.currentTaxid).then(function(data) {
                    ctrl.orgName = data;
                });
                iconMap.getMap(function(data) {
                    ctrl.icon = data[ctrl.currentTaxid];
                });

                // get all gene data for gene search
                allOrgGenes.getAllOrgGenes(ctrl.currentTaxid)
                    .then(function (data) {
                        ctrl.currentAllGenes = data.data.results.bindings;
                    });

                // get all organism data for forms
                allOrgs.getAllOrgs(function (data) {
                    ctrl.orgList = data;
                    ctrl.currentOrg = $filter('getJsonItemOrg')('taxid', ctrl.currentTaxid, ctrl.orgList);
                    if (ctrl.currentOrg == undefined) {
                        alert("not a valid taxonomy id");
                        $location.path('/');
                    }
                    ctrl.backgrounds = [];
                    angular.forEach(ctrl.orgList, function(strain) {
                        ctrl.backgrounds.push(strain.taxid == ctrl.currentTaxid);
                    });
                    while (ctrl.backgrounds.length != 4) {
                        ctrl.backgrounds.push(false);
                    }
                });

                ctrl.hasprotein = true;

                ////send form data to server to edit wikidata
                ctrl.getServerAnnotationData = function (anno_keys) {
                    var url_suf = $location.path() + '/mg_mutant_view';

                    sendToView.sendToView(url_suf, anno_keys).then(function (data) {

                        ctrl.annotations.mutants = data.data.mutants;
                    });
                };


            };

        },
        templateUrl: '/static/build/js/angular_templates/main-page_new.min.html'
    });