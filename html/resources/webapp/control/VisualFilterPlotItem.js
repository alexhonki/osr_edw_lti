sap.ui.define([ "sap/fiori/cri/control/VisualFilterItem"],
    /**
     * Heatmap Item
     * @param {sap.fiori.cri.control.VisualFilterItem} VisualFilterItem Base Visual Filter Item
     * @returns {*} VisualFilter item for plotting
     */
    function (VisualFilterItem) {
        'use strict';
        return VisualFilterItem.extend("sap.fiori.cri.control.VisualFilterPlotItem",{
            metadata: {
                properties: {
                    "xValue" : {type: "float", group: "Misc", defaultValue: 1.0},
                    "yValue" : {type: "float", group: "Misc", defaultValue: 1.0}
                }
            }
        });
    }
);