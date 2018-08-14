sap.ui.define(["sap/ui/model/json/JSONModel"], function(JSONModel) {
    "use strict";

    sap.ui.controller("sap.demo.sample.controller.PersonalizationApp", {
        onInit: function() {
            // Read potentially existing personalization favorites.
            var oView,
                oConstants;

            oView = this.getView();
            oConstants = sap.ushell.Container.getService("Personalization").constants;

            this.oPersonalizer = sap.ushell.Container.getService("Personalization").getPersonalizer(
                {
                    container : "PersonalizationApp",
                    item : "Order"
                },
                {
                    keyCategory : oConstants.keyCategory.FIXED_KEY,
                    writeFrequency: oConstants.writeFrequency.LOW,
                    clientStorageAllowed : true
                },
                sap.ui.component(sap.ui.core.Component.getOwnerIdFor(oView))
            );
        },

        onBeforeRendering: function() {
            var oView = this.getView(),
                oTable = this.byId('PersonalizationTable'),
                that = this;

            this.aCols = oTable.getAggregation('columns');

            oView.setBusy(true);
            this.oPersonalizer.getPersData()
                .done(function(oData) {
                    if(oData) {
                        // Reorder table columns using personalization data
                        that.aLastOrder = oData;
                        oTable.removeAllColumns();
                        oData.forEach(function (idx) {
                            oTable.addColumn(that.aCols[idx]);
                        });
                    } else {
                        that.aLastOrder = (n => { let a=[]; while(n--) {a.unshift(n)} return a})(that.aCols.length);
                    }
                    oView.setBusy(false);
                })
                .fail(function(err) {
                    oView.setBusy(false);
                });

            oTable.addEventDelegate({
                "onAfterRendering": function() {
                    var newOrder;
                    if(that.aLastOrder) {
                        // Actual rendered columns order
                        newOrder = oTable.getAggregation('columns').map(function (col) {
                            return that.aCols.indexOf(col);
                        });
                        // If new columns order not equal to last one
                        // received from personalization service
                        if (that.aLastOrder.some(function (i, j) {
                            return i !== newOrder[j];
                        })) {
                            // Update last order
                            that.aLastOrder = newOrder;
                            // Save personalized columns order
                            that.oPersonalizer.setPersData(newOrder);
                        }
                    }
                }
            });
        }
    });

});