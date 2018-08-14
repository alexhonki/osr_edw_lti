sap.ui.define(["sap/ui/core/Element"],
    /**
     * Heatmap Item
     * @param {sap.ui.core.Element} Element UI5 Base Element
     * @returns {*} Heatmap item
     */
    function (Element) {
        'use strict';
        return Element.extend("sap.fiori.cri.control.HeatmapItem",{
            metadata: {
                properties: {
                    "x" : {type: "int", group: "Misc", defaultValue: null},
                    "y" : {type: "int", group: "Misc", defaultValue: null},
                    "measure" : {type: "float", group: "Misc", defaultValue: 1.0}
                }
            }
        });
    }
);