$.import("exits", "Utils");
var Utils = $.exits.Utils;
var conn = $.db.getConnection();

var XSDS = $.require("@sap/cds").xsjs(conn);  // “cds” refers to node-cds
function createLabelDefinitions(param) {
	   $.trace.debug("Update Label Definitions exit called");
	   let before = param.beforeTableName;
	   let after = param.afterTableName;
	   let pStmt = param.connection.prepareStatement('select * from "' + after +'"');
	   
	   // Get Input Data from OData Create
	   var data = Utils.recordSetToJSON(pStmt.executeQuery(),'LabelDefinition');	   
	   
	   var promiseImportEntities = Utils.getImportEntitiesPromise(["db::ui.label.definition"]);
		
	   try {
			var oRow = data.LabelDefinition[0];
			promiseImportEntities.then(function(entities) {
			var LabelDefinition = entities["db::ui.label.definition"];
				return Utils.getTxPromise([LabelDefinition]);
			}).then(function(txObj) {
				$.trace.debug('Create new entity: Label Definition');
				var oHistory = {
											DATE : new Date(),
											BY: $.session.getUsername()
								};
			var oLabelDefinition = {
					$entity: txObj.entities[0],
					REACTION_TYPE	: oRow.REACTION_TYPE,
					PAGE			: oRow.PAGE,
					COMPONENT		: oRow.COMPONENT,
					LANGUAGE		: oRow.LANGUAGE,
					LABEL			: oRow.LABEL,
					CREATED			: oHistory		       			
					};
			return Utils.getTxSavePromise(oLabelDefinition, txObj.tx);
		}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "Execution Error: " + (error.message || error);
		});
	
		} catch(e) {
			throw "Execution Error: " + (e.message || e);
		} finally {
			pStmt.close();
		}	   
	   
};

function updateLabelDefinitions(param) {
	   $.trace.debug("Update Label Definitions exit called");
	   let before = param.beforeTableName;
	   let after = param.afterTableName;
	   let pStmt = param.connection.prepareStatement('select * from "' + after +'"');
	   
	   // Get Input Data from OData Create
	   var data = Utils.recordSetToJSON(pStmt.executeQuery(),'LabelDefinition');	   
	   var oLabelDefinition;
	   
	   var promiseImportEntities = Utils.getImportEntitiesPromise(["db::ui.label.definition"]);

	   try {
	   		var oRow = data.LabelDefinition[0];
			promiseImportEntities.then(function(entities) {
			var LabelDefinition = entities["db::ui.label.definition"];
				return Utils.getTxPromise([LabelDefinition]);
			}).then(function(txObj) {
				return Utils.getTxFindPromise(txObj.entities[0], {
								REACTION_TYPE	: oRow.REACTION_TYPE,
								PAGE			: oRow.PAGE,
								COMPONENT		: oRow.COMPONENT,
								LANGUAGE		: oRow.LANGUAGE
			}, txObj.tx);
			}).then(function(findObj) {
				var oHistory = {
										DATE : new Date(),
										BY: $.session.getUsername()
								};
			// get the first entity returned with same key & update its fields
			if (findObj.entities.length > 0) {
				var oLabelDefinition = findObj.entities[0];
				oLabelDefinition.REACTION_TYPE	= oRow.REACTION_TYPE;
				oLabelDefinition.PAGE			= oRow.PAGE;
				oLabelDefinition.COMPONENT		= oRow.COMPONENT;
				oLabelDefinition.LANGUAGE		= oRow.LANGUAGE;
				oLabelDefinition.LABEL			= oRow.LABEL;
				oLabelDefinition.CHANGED		= oHistory;						
			} else {
				$.trace.debug('Create new entity: Label Definition');
				var oLabelDefinition = {
					$entity: findObj.entityType,
					REACTION_TYPE	: oRow.REACTION_TYPE,
					PAGE			: oRow.PAGE,
					COMPONENT		: oRow.COMPONENT,
					LANGUAGE		: oRow.LANGUAGE,
					CREATED			: oHistory		       			
				};							
			}
		return Utils.getTxSavePromise(oLabelDefinition, findObj.tx);
		}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "Execution Error: " + (error.message || error);
		});
	   	
		
		} catch(e) {
			throw "Execution Error: " + (e.message || e);
		} finally {
			pStmt.close();
		}
};



function validValue(oValue1, oValue2) {
	return (oValue1 != undefined) ? oValue1 : oValue2;
};