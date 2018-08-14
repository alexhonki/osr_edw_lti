//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/CardService",
        "sap/fiori/cri/control/trend/TrendCard"
    ],
    /**
     * Event Overview Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.CardService} CardService Card Service
     * @param {sap.fiori.cri.control.trend.TrendCard} TrendCard Trend Card control
     * @returns {*} Trend Analysis Controller
     */
    function (BaseController, CardService, TrendCard) {
        "use strict";

        //noinspection JSValidateJSDoc
        return BaseController.extend("sap.fiori.cri.controller.TrendAnalysis", {
            /**
             * Controller init
             */
            onInit: function () {
                this.timestamps = {};
                this.getView().setModel(new sap.ui.model.json.JSONModel({
                    FilteredBy:""
                }), "viewModel");
            },
            onAfterRendering: function () {
                this.loadLabels("TrendAnalysis", "en-US", function () {
                    this.setupCards();
                    this.updateFilterText();
                }.bind(this));
            },
            setupCards: function () {
                CardService.getCardConfigurations(function (oCardConfigs) {
                    this.oCardConfigs = oCardConfigs;

                    var aIntents = oCardConfigs.map(function (oCardConfig) {
                       return oCardConfig.intent;
                    }).filter(function (sIntent) {
                        return sIntent != null;
                    });

                    var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    if (oCrossAppNavigator) {
                        oCrossAppNavigator.isIntentSupported(aIntents).done(function (oIntentSupport) {
                            this.oIntentSupport = oIntentSupport;
                            this.addCards(oCardConfigs);
                        }.bind(this));
                    } else {
                        this.addCards(oCardConfigs);
                    }

                }.bind(this));
            },
            addCards: function (oCardConfigs) {
                oCardConfigs.forEach(function(oCardConfig, iCardIndex){
                    var sIntent = oCardConfig.intent;
                    if (!sIntent || !this.oIntentSupport || !this.oIntentSupport[sIntent] || this.oIntentSupport[sIntent].supported) {
                        this.addCard(oCardConfig, iCardIndex);
                        this.updateCard(oCardConfig, iCardIndex);
                    }
                }.bind(this));
            },
            onFilterChanged: function (oEvent) {
                this.updateCards(this.oCardConfigs);
                this.updateFilterText();
            },
            onClearFilters: function (oEvent) {
                this.updateCards(this.oCardConfigs);
                this.updateFilterText();
            },
            updateFilterText:function () {
                var filterLabels = this.getView().byId("idFilterBar").getSelectedFilterLabels();
                if (filterLabels) {
                    this.getView().getModel("viewModel").setProperty("/FilteredBy", "Filtered By: " + filterLabels.join(", "));
                }
            },
            addCard: function (oCardConfig) {
                var oLabelsModel = this.getView().getModel("Labels");

                var oCardData = CardService.buildCardData(oCardConfig, oLabelsModel);

                var sId = this.getView().createId(oCardConfig.id);

                var oTrendCard = new TrendCard(sId);
                oTrendCard.setCardData(oCardData);

                if (!this.oCardsById) { this.oCardsById = {}; }
                this.oCardsById[oCardConfig.id] = oTrendCard;

                this.getView().byId("idCardContainer").addContent(oTrendCard);
            },
            updateCards: function (oCardConfigs) {
                oCardConfigs.forEach(function (oCardConfig, iCardIndex) {
                    var sIntent = oCardConfig.intent;
                    if (!sIntent || !this.oIntentSupport || !this.oIntentSupport[sIntent] || this.oIntentSupport[sIntent].supported) {
                        this.updateCard(oCardConfig, iCardIndex);
                    }
                }.bind(this));
            },
            updateCard: function (oCardConfig, iCardIndex) {
                var oCard = this.oCardsById[oCardConfig.id];
                var oCardData = oCard.getCardData();

                oCardData.loading = true;

                if (oCardData.kpi) {
                    oCardData.kpi.value = null;
                    oCardData.kpi.formattedValue = null;
                }

                if (oCardData.comparison) {
                    oCardData.comparison.value = null;
                    oCardData.comparison.formattedValue = null;
                }

                oCard.setCardData(oCardData);

                var timestamp = Date.now();
                this.timestamps[oCardConfig.id] = timestamp;
                CardService.updateCardData(oCardConfig, oCardData, this.getView().getModel("CRI"), function (oCardData) {
                    if (this.timestamps[oCardConfig.id] == timestamp) {
                        oCard.setCardData(oCardData);
                    } else {
                        return;
                    }
                }.bind(this));
            }
        });
    }
);