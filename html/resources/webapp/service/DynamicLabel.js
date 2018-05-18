sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/fiori/cri/service/ErrorService"
], function (JSONModel, ErrorService) {
    "use strict";
    return {
        processLabels: function (requiredLabels, savedLabels, config, callback) {
            var currentUseCaseLabels = [];
            var defaultUseCaseLabels = [];
            savedLabels.forEach(function (label) {
                if (label["REACTION_TYPE"] == config.currentUseCase) {
                    currentUseCaseLabels.push(label);
                } else if (label["REACTION_TYPE"] == config.defaultUseCase) {
                    defaultUseCaseLabels.push(label);
                }
            });

            var missingLabels = [];
            var allLabels = [];
            requiredLabels.forEach(function (requiredLabelDefault) {
                var foundLabel = false;
                currentUseCaseLabels.forEach(function (label) {
                    if (label["PAGE"] == requiredLabelDefault["Page"] && label["COMPONENT"] == requiredLabelDefault["Component"] && label["LANGUAGE"] == config.language) {
                        foundLabel = true;
                        allLabels.push({
                            Page: label["PAGE"],
                            Component: label["COMPONENT"],
                            Description: requiredLabelDefault["Description"],
                            LabelDefault: requiredLabelDefault["Label"],
                            Label: label["LABEL"],
                            CascadeFromDefault: false
                        });
                    }
                });

                if (foundLabel) {
                    return;
                }

                defaultUseCaseLabels.forEach(function (label) {
                    if (label["PAGE"] == requiredLabelDefault["Page"] && label["COMPONENT"] == requiredLabelDefault["Component"] && label["LANGUAGE"] == config.language) {
                        foundLabel = true;
                        allLabels.push({
                            Page: label["PAGE"],
                            Component: label["COMPONENT"],
                            Description: requiredLabelDefault["Description"],
                            LabelDefault: requiredLabelDefault["Label"],
                            Label: label["LABEL"],
                            CascadeFromDefault: true
                        });
                    }
                });

                if (foundLabel) {
                    return;
                }

                requiredLabelDefault["LabelDefault"] = requiredLabelDefault["Label"];
                allLabels.push(requiredLabelDefault);

                //Server does not contain label for required type
                missingLabels.push({
                    "PAGE": requiredLabelDefault["Page"],
                    "COMPONENT": requiredLabelDefault["Component"],
                    "LABEL": requiredLabelDefault["Label"],
                    "LANGUAGE": config.language,
                    "REACTION_TYPE": config.defaultUseCase
                });
            });

            callback(allLabels, missingLabels);
        },
        /**
         * Convert Label JSON to standard i18n format
         * @param aLabelJSON the array of labels to convert
         * @returns {string} formatted string representation of properties file
         */
        createI18NfromLabelJSON: function (aLabelJSON) {
            var sOutputI18N = "";

            aLabelJSON.forEach(function (oLabel) {
                sOutputI18N += "#" + oLabel.Description + "\n";
                sOutputI18N += oLabel.Page + "." + oLabel.Component + "=" + oLabel.Label + "\n";
            });

            return sOutputI18N.trim();
        },
        /**
         * Convert properties file to Label JSON
         * @param sEditableI18NRaw labels to convert
         * @returns {Array} Array of labels in Label JSON format
         */
        createLabelJSONfromI18N: function (sEditableI18NRaw) {
            var aLines = sEditableI18NRaw.split("\n");

            var aLabelJSON = [];

            for (var i = 0; i < aLines.length; i++) {
                var sCurrentLine = aLines[i];
                sCurrentLine = sCurrentLine.trim();
                var sPrevLine = i > 0 ? aLines[i - 1] : null;
                if (sCurrentLine === "" || sCurrentLine[0] === "#") {
                    continue;
                }

                var sKey = sCurrentLine.substr(0, sCurrentLine.indexOf("=")).trim();
                var sPage = sKey.substr(0, sKey.indexOf(".")).trim();
                var sComponent = sKey.substr(sKey.indexOf(".") + 1, sKey.length).trim();
                var sValue = sCurrentLine.substr(sCurrentLine.indexOf("=") + 1, sCurrentLine.length).trim();
                var sDescription = (sPrevLine || "").substr(1);

                if (!sKey || !sPage || !sComponent || !sValue || !sDescription) {
                    //Invalid line found, abort processing
                    return null;
                }

                aLabelJSON.push({
                    "Page": sPage,
                    "Component": sComponent,
                    "Description": sDescription,
                    "Label": sValue
                });
            }

            return aLabelJSON;
        },
        /**
         * Load default label settings from properties file
         * @param fnOnDone
         * @private
         */
        _loadDefaults: function (fnOnDone, oOptions) {
            var sI18Npath = jQuery.sap.getResourcePath("sap/fiori/cri/i18n/i18n.properties");
			oOptions = jQuery.extend({}, oOptions);
			oOptions.ClearCache = false;

            var that = this;

            if (!this.oI18NRawRequest) {
                this.oI18NRawRequest = new XMLHttpRequest();
            }

            if (this.oI18NRawRequest.readyState === 4 && !!that.sEditableI18N && !oOptions.ClearCache) {
                fnOnDone(that.createLabelJSONfromI18N(that.sEditableI18N));
            }

            this.oI18NRawRequest.addEventListener("load", function (oEvt) {
                if(!that.sEditableI18N || oOptions.ClearCache) {
                    var sUserEditableConst = "#USER_EDITABLE";
                    var sRawI18N = this.response;
                    that.sEditableI18N = sRawI18N.substr(sRawI18N.indexOf(sUserEditableConst) + sUserEditableConst.length, sRawI18N.length).trim();
                }

                fnOnDone(that.createLabelJSONfromI18N(that.sEditableI18N));

            });

            this.oI18NRawRequest.addEventListener("error", function (oEvt) {
                fnOnDone(null);
            });

            if (this.oI18NRawRequest.readyState === 0 || (this.oI18NRawRequest.readyState === 4 && oOptions.ClearCache)) {
                this.oI18NRawRequest.open("GET", sI18Npath);
                this.oI18NRawRequest.send();
            }
        },
        loadLabels: function (criModel, config, callback) {
            var savedLabelsLoaded = false;
            var i18nLoaded = false;
            var requiredLabels = [];
            var savedLabels = [];
            var defaultUseCase = "CHURN";
            var currentUseCase = config.currentUseCase || defaultUseCase;

            var onAllLoaded = function () {
                this.processLabels(requiredLabels, savedLabels,
                    {
                        language: config.language,
                        defaultUseCase: defaultUseCase,
                        currentUseCase: currentUseCase
                    },
                    callback
                );
            }.bind(this);

            this._loadDefaults(function (loadedLabels) {
                i18nLoaded = true;
                requiredLabels = loadedLabels;

                if (savedLabelsLoaded && i18nLoaded) {
                    onAllLoaded();
                }
            });


            var filters = [
                new sap.ui.model.Filter("DEFAULT", sap.ui.model.FilterOperator.EQ, 1)
            ];
            if (config.currentUseCase) {
                filters.push(new sap.ui.model.Filter("REACTION_TYPE", sap.ui.model.FilterOperator.EQ, config.currentUseCase));
            } else {
                filters.push(new sap.ui.model.Filter("IS_ENABLED", sap.ui.model.FilterOperator.EQ, 1));
            }
            criModel.read("/UseCaseConfig", {
                urlParameters: {
                    "$expand": "LabelDefinition"
                },
                filters: [
                    new sap.ui.model.Filter({
                        filters: filters,
                        and: false
                    })
                ],
                success: function (oData) {
                    try {
                        oData.results.forEach(function (useCase) {
                            if (!(config.currentUseCase) && useCase["IS_ENABLED"] == 1) {
                                currentUseCase = useCase["REACTION_TYPE"];
                            }

                            if (useCase["DEFAULT"] == 1) {
                                defaultUseCase = useCase["REACTION_TYPE"];
                            }

                            savedLabels.push.apply(savedLabels, useCase["LabelDefinition"].results);
                        });

                        savedLabelsLoaded = true;

                        if (savedLabelsLoaded && i18nLoaded) {
                            onAllLoaded();
                        }
                    } catch (oError) {
                        ErrorService.raiseGenericError(oError);
                    }
                },
                error: function (oError) {
                    ErrorService.raiseGenericError(oError);
                }
            });
        }
    };
});
