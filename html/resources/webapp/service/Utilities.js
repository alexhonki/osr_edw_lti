sap.ui.define(['sap/ui/core/util/File'], function (File) {
    "use strict";
    return {
        saveCSV: function (rows, filename) {


            var csvContent = "";
            rows.forEach(function(infoArray, index){
                var escapedStrings = [];
                infoArray.forEach(function (cell) {
                    if(cell == null) {
                        escapedStrings.push('');
                    } else {
                        escapedStrings.push('"' + cell.toString().replace('"','""') + '"');
                    }
                });
                var rowString = escapedStrings.join(",");
                csvContent += index < rows.length ? rowString + "\n" : rowString;
            });

            File.save(csvContent, (filename ? filename : "export"), "csv", "text/csv", "utf-8");
        }, 
        	/**
             * Returns icon name based on icon unicode
             * @returns {string} Icon Name
             */
            getEventGroupIcon: function (sEventIconCode) {
                var sGroupIcon = "";
                switch (sEventIconCode){
                    case "e125":
                        sGroupIcon = "manager-insight";
                        break;
                    case "e117":
                        sGroupIcon = "collections-insight";
                        break;
                    case "e114":
                        sGroupIcon = "crm-sales";
                        break;
                    case "e1aa":
                        sGroupIcon = "activity-assigned-to-goal";
                        break;
                    case "e054":
                        sGroupIcon = "addresses";
                        break;
                    case "e020":
                        sGroupIcon = "money-bills";
                        break;
                    case "e1a6":
                        sGroupIcon = "activity-individual";
                        break;
                }

                return sGroupIcon;
                    
                    
            }
    };
});