$.import("exits", "Utils");
var Utils = $.exits.Utils;
var conn = $.db.getConnection();
var XSDS = $.require("@sap/cds").xsjs(conn); // “cds” refers to node-cds

function updateAttributeTypes(param) {
	$.trace.debug("Update Attribute Types exit called");
	let before = param.beforeTableName;
	let after = param.afterTableName;
	let pStmt = param.connection.prepareStatement('select * from "' + after + '"');
	// GET entity	
	var promiseImportEntities = Utils.getImportEntitiesPromise(["db::app.AttributeTypes"]);

	// Get Input Data from OData Create
	var data = Utils.recordSetToJSON(pStmt.executeQuery(), 'Attribute')['Attribute'];
	try {
		var oRow = data[0];
		promiseImportEntities.then(function(entities) {
			var Config = entities["db::app.AttributeTypes"];
			return Utils.getTxPromise([Config]);
		}).then(function(txObj) {
			return Utils.getTxFindPromise(txObj.entities[0], {
				ATTRIBUTE_ID: oRow.ATTRIBUTE_ID
			}, txObj.tx);
		}).then(function(findObj) {
			// get the first entity returned with same key & update its fields
			if (findObj.entities.length > 0) {
				var oConfig = setConfigAttributes(findObj.entities[0], oRow);
			}
			$.trace.debug('Attribute Type: Saving Entity');
			return Utils.getTxSavePromise(oConfig, findObj.tx);
		}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "Execution Error: " + (error.message || error);
		});
	} catch (e) {
		throw "Execution Error: " + (e.message || e);
	} finally {
		pStmt.close();
	}
};

function setConfigAttributes(oConfig, oRow) {
	oConfig.ATTRIBUTE_ID = oRow.ATTRIBUTE_ID;
	oConfig.IS_FILTER = oRow.IS_FILTER;
	oConfig.IS_SENSITIVE = oRow.IS_SENSITIVE;
	oConfig.IS_SHOW_DETAILS = oRow.IS_SHOW_DETAILS;
	return oConfig;
}

function updateFilterDates(param) {
	$.trace.debug("Update FilterDates exit called");
	let before = param.beforeTableName;
	let after = param.afterTableName;
	let pStmt = param.connection.prepareStatement('select * from "' + after + '"');

	// Get Input Data from OData Create
	var data = Utils.recordSetToJSON(pStmt.executeQuery(), 'ConfigBucket');

	// GET entity	
	var promiseImportEntities = Utils.getImportEntitiesPromise(["db::adm.config.bucketCustom", "db::adm.config.bucket"]);

	try {
		var oRow = data.ConfigBucket[0];
		promiseImportEntities.then(function(entities) {
			var ConfigBucket = entities["db::adm.config.bucketCustom"];
			var DefaultConfigBucket = entities["db::adm.config.bucket"];
			return Utils.getTxPromise([ConfigBucket, DefaultConfigBucket]);
		}).then(function(txObj) {
			return Promise.all([
				Utils.getTxFindPromise(txObj.entities[0], {
					BUCKET_ID: 'FILTER_DATES',
					IS_ENABLED: 1
				}, txObj.tx), //ConfigBucket
				Utils.getTxFindPromise(txObj.entities[1], {
					BUCKET_ID: 'FILTER_DATES',
					IS_ENABLED: 1
				}, txObj.tx), //DefaultConfigBucket
				Utils.getTxFindPromise(txObj.entities[0], {
					BUCKET_ID: 'FILTER_DATES',
					SEQ: oRow.SEQ
				}, txObj.tx), //ConfigBucket 
				Utils.getTxFindPromise(txObj.entities[1], {
					BUCKET_ID: 'FILTER_DATES',
					SEQ: oRow.SEQ
				}, txObj.tx)
			]); //DefaultConfigBucket                       
		}).then(function(aValues) {
			var oConfigBucket, oDefaultConfigBucket, oConfigBucketCurrent, oDefaultConfigBucketCurrent, tx;
			oConfigBucket = aValues[0].entities[0];
			oDefaultConfigBucket = aValues[1].entities[0];
			oConfigBucketCurrent = aValues[2].entities[0];
			oDefaultConfigBucketCurrent = aValues[3].entities[0];
			tx = aValues[0].tx;
			var newConfigBucket, newConfigBucketCurrent;
			var oHistory = {
				CHANGED_ON: new Date(),
				CHANGED_BY: $.session.getUsername()
			};
			/*
			 * Toggle Active Use Case (Reaction Type)
			 * Step 1: Change IS_ENABLED to 0 (disable)
			 * Step 2: Save
			 */
			if (oConfigBucket) {
				oConfigBucket.IS_ENABLED = 0;
				oConfigBucket.isChanged = true;
			} else {

				newConfigBucket = {
					$entity: aValues[0].entityType,
					BUCKET_ID: 'FILTER_DATES',
					SEQ: oDefaultConfigBucket.SEQ,
					STR_VALUE: oDefaultConfigBucket.STR_VALUE,
					DESCRIPTION: oDefaultConfigBucket.DESCRIPTION,
					IS_ENABLED: 0,
					CHANGED_ON: new Date(),
					CHANGED_BY: $.session.getUsername(),
					REACTION_TYPE: 'NA'
				};
				newConfigBucket.isChanged = true;

			}
			/*
			 * Get Current Use Case that is being edited
			 *  Set Values
			 */
			if (oConfigBucketCurrent) {
				oConfigBucketCurrent.STR_VALUE = oRow.STR_VALUE;
				oConfigBucketCurrent.DESCRIPTION = validValue(oRow.DESCRIPTION, oConfigBucketCurrent.DESCRIPTION);
				oConfigBucketCurrent.IS_ENABLED = validValue(oRow.IS_ENABLED, oConfigBucketCurrent.IS_ENABLED);
				oConfigBucketCurrent.CHANGED_ON = new Date();
				oConfigBucketCurrent.CHANGED_BY = $.session.getUsername();
				oConfigBucketCurrent.isChanged = true;
			} else {
				$.trace.debug('Create new entity: Filter');

				newConfigBucketCurrent = {
					$entity: aValues[0].entityType,
					BUCKET_ID: 'FILTER_DATES',
					SEQ: oRow.SEQ,
					STR_VALUE: oRow.STR_VALUE,
					DESCRIPTION: oRow.DESCRIPTION,
					IS_ENABLED: validValue(oRow.IS_ENABLED, oDefaultConfigBucketCurrent.IS_ENABLED),
					CHANGED_ON: new Date(),
					CHANGED_BY: $.session.getUsername(),
					REACTION_TYPE: 'NA'
				};
				newConfigBucketCurrent.isChanged = true;

			}
			$.trace.debug('Saving FilterDate');
			var aSavingEntities = [];
			if (oConfigBucket && oConfigBucket.isChanged) {
				aSavingEntities.push(oConfigBucket);
			}
			if (oConfigBucketCurrent && oConfigBucketCurrent.isChanged) {
				aSavingEntities.push(oConfigBucketCurrent);
			}
			if(newConfigBucket && newConfigBucket.isChanged) {
				aSavingEntities.push(newConfigBucket);
			}
			if (newConfigBucketCurrent && newConfigBucketCurrent.isChanged) {
				aSavingEntities.push(newConfigBucketCurrent);
			}
			return Utils.getTxSaveAllPromise(aSavingEntities, tx);
		}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "Execution Error: " + (error.message || error);
		});
	} catch (e) {
		throw "Execution Error: " + (e.message || e);
	} finally {
		pStmt.close();
	}
};

function updatePredictionDate(param) {
	$.trace.debug("Update PredictFilterDate exit called");
	let before = param.beforeTableName;
	let after = param.afterTableName;
	let pStmt = param.connection.prepareStatement('select * from "' + after + '"');

	// Get Input Data from OData Create
	var data = Utils.recordSetToJSON(pStmt.executeQuery(), 'ConfigBucket');
	// GET entity	
	var promiseImportEntities = Utils.getImportEntitiesPromise(["db::adm.config.bucketCustom", "db::adm.config.bucket"]);

	try {
		var oRow = data.ConfigBucket[0];
		promiseImportEntities.then(function(entities) {
			var ConfigBucket = entities["db::adm.config.bucketCustom"];
			var DefaultConfigBucket = entities["db::adm.config.bucket"];
			return Utils.getTxPromise([ConfigBucket, DefaultConfigBucket]);
		}).then(function(txObj) {
			return Promise.all([
				Utils.getTxFindPromise(txObj.entities[0], {
					BUCKET_ID: 'PREDICT_START_DATE',
					IS_ENABLED: 1
				}, txObj.tx), //ConfigBucket
				Utils.getTxFindPromise(txObj.entities[1], {
					BUCKET_ID: 'PREDICT_START_DATE',
					IS_ENABLED: 1
				}, txObj.tx), //DefaultConfigBucket
				Utils.getTxFindPromise(txObj.entities[0], {
					BUCKET_ID: 'PREDICT_START_DATE',
					SEQ: oRow.SEQ
				}, txObj.tx), //ConfigBucket 
				Utils.getTxFindPromise(txObj.entities[1], {
					BUCKET_ID: 'PREDICT_START_DATE',
					SEQ: oRow.SEQ
				}, txObj.tx)
			]); //DefaultConfigBucket                       
		}).then(function(aValues) {
			var oConfigBucket, oDefaultConfigBucket, oConfigBucketCurrent, oDefaultConfigBucketCurrent, tx;
			oConfigBucket = aValues[0].entities[0];
			oDefaultConfigBucket = aValues[1].entities[0];
			oConfigBucketCurrent = aValues[2].entities[0];
			oDefaultConfigBucketCurrent = aValues[3].entities[0];
			tx = aValues[0].tx;
			var newConfigBucket, newConfigBucketCurrent;
			var oHistory = {
				CHANGED_ON: new Date(),
				CHANGED_BY: $.session.getUsername()
			};
			/*
			 * Toggle Active Use Case (Reaction Type)
			 * Step 1: Change IS_ENABLED to 0 (disable)
			 * Step 2: Save
			 */
			if (oConfigBucket) {
				oConfigBucket.IS_ENABLED = 0;
				oConfigBucket.isChanged = true;
			} else {

				newConfigBucket = {
					$entity: aValues[0].entityType,
					BUCKET_ID: 'PREDICT_START_DATE',
					SEQ: oDefaultConfigBucket.SEQ,
					STR_VALUE: oDefaultConfigBucket.STR_VALUE,
					DESCRIPTION: oDefaultConfigBucket.DESCRIPTION,
					IS_ENABLED: 0,
					CHANGED_ON: new Date(),
					CHANGED_BY: $.session.getUsername(),
					REACTION_TYPE: 'NA'
				};
				newConfigBucket.isChanged = true;

			}
			/*
			 * Get Current Use Case that is being edited
			 *  Set Values
			 */
			if (oConfigBucketCurrent) {
				oConfigBucketCurrent.STR_VALUE = oRow.STR_VALUE;
				oConfigBucketCurrent.DESCRIPTION = validValue(oDefaultConfigBucketCurrent.DESCRIPTION, oConfigBucketCurrent.DESCRIPTION);
				oConfigBucketCurrent.IS_ENABLED = validValue(oRow.IS_ENABLED, oConfigBucketCurrent.IS_ENABLED);
				oConfigBucketCurrent.CHANGED_ON = new Date();
				oConfigBucketCurrent.CHANGED_BY = $.session.getUsername();
				oConfigBucketCurrent.isChanged = true;
			} else {
				$.trace.debug('Create new entity: Predict start date');

				newConfigBucketCurrent = {
					$entity: aValues[0].entityType,
					BUCKET_ID: 'PREDICT_START_DATE',
					SEQ: oRow.SEQ,
					STR_VALUE: oRow.STR_VALUE,
					DESCRIPTION: oRow.DESCRIPTION,
					IS_ENABLED: validValue(oRow.IS_ENABLED, oDefaultConfigBucketCurrent.IS_ENABLED),
					CHANGED_ON: new Date(),
					CHANGED_BY: $.session.getUsername(),
					REACTION_TYPE: 'NA'
				};
				newConfigBucketCurrent.isChanged = true;

			}
			$.trace.debug('Saving FilterDate');
			var aSavingEntities = [];
			if (oConfigBucket && oConfigBucket.isChanged) {
				aSavingEntities.push(oConfigBucket);
			}
			if (oConfigBucketCurrent && oConfigBucketCurrent.isChanged) {
				aSavingEntities.push(oConfigBucketCurrent);
			}
			if(newConfigBucket && newConfigBucket.isChanged) {
				aSavingEntities.push(newConfigBucket);
			}
			if (newConfigBucketCurrent && newConfigBucketCurrent.isChanged) {
				aSavingEntities.push(newConfigBucketCurrent);
			}
			return Utils.getTxSaveAllPromise(aSavingEntities, tx);
		}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "Execution Error: " + (error.message || error);
		});
	} catch (e) {
		throw "Execution Error: " + (e.message || e);
	} finally {
		pStmt.close();
	}
};

function updateConfig(param) {
	$.trace.debug("Update Config exit called");
	let before = param.beforeTableName;
	let after = param.afterTableName;
	let pStmt = param.connection.prepareStatement('select * from "' + after + '"');

	// Get Input Data from OData Create
	var data = Utils.recordSetToJSON(pStmt.executeQuery(), 'ConfigBucket');

	// GET entity	
	var promiseImportEntities = Utils.getImportEntitiesPromise(["db::adm.config.bucketCustom", "db::adm.config.bucket"]);

	try {
		var oRow = data.ConfigBucket[0];
		promiseImportEntities.then(function(entities) {
			var ConfigBucket = entities["db::adm.config.bucketCustom"];
			var DefaultConfigBucket = entities["db::adm.config.bucket"];
			return Utils.getTxPromise([ConfigBucket, DefaultConfigBucket]);
		}).then(function(txObj) {
			return Promise.all([
				Utils.getTxFindPromise(txObj.entities[0], {
					BUCKET_ID: oRow.BUCKET_ID,
					SEQ: oRow.SEQ,
					REACTION_TYPE: oRow.REACTION_TYPE
				}, txObj.tx), //ConfigBucket
				Utils.getTxFindPromise(txObj.entities[1], {
					BUCKET_ID: oRow.BUCKET_ID,
					SEQ: oRow.SEQ,
					REACTION_TYPE: oRow.REACTION_TYPE
				}, txObj.tx)
			]); //DefaultConfigBucket
		}).then(function(aValues) {
			var oConfigBucket, oDefaultConfigBucket, oConfigBucketCurrent, oDefaultConfigBucketCurrent, tx;
			oConfigBucket = aValues[0].entities[0];
			oDefaultConfigBucket = aValues[1].entities[0];
			tx = aValues[0].tx;
			var newConfigBucket, newConfigBucketCurrent;
			var oHistory = {
				CHANGED_ON: new Date(),
				CHANGED_BY: $.session.getUsername()
			};

			if (oConfigBucket) {
				oConfigBucket.FROM_VALUE = validValue(oRow.FROM_VALUE, oConfigBucket.FROM_VALUE);
				oConfigBucket.TO_VALUE = validValue(oRow.TO_VALUE, oConfigBucket.TO_VALUE);
				oConfigBucket.STR_VALUE = oRow.STR_VALUE || '';
				oConfigBucket.DESCRIPTION = validValue(oRow.DESCRIPTION, oConfigBucket.DESCRIPTION);
				oConfigBucket.IS_ENABLED = validValue(oRow.IS_ENABLED, oConfigBucket.IS_ENABLED);
				oConfigBucket.REACTION_TYPE = oRow.REACTION_TYPE || '';
				oConfigBucket.CHANGED_ON = new Date(),
				oConfigBucket.CHANGED_BY = $.session.getUsername();

			} else {

				oConfigBucket = {
					$entity: aValues[0].entityType,
					BUCKET_ID: oRow.BUCKET_ID,
					SEQ: oRow.SEQ,
					FROM_VALUE: validValue(oRow.FROM_VALUE, oDefaultConfigBucket.FROM_DEFAULT), // Use default value if not set
					TO_VALUE: validValue(oRow.TO_VALUE, oDefaultConfigBucket.TO_DEFAULT), // Use default value if not set
					STR_VALUE: validValue(oRow.STR_VALUE, oDefaultConfigBucket.STR_DEFAULT),
					DESCRIPTION: oRow.DESCRIPTION,
					REACTION_TYPE: oRow.REACTION_TYPE,
					IS_ENABLED: validValue(oRow.IS_ENABLED, oDefaultConfigBucket.IS_ENABLED),
					CHANGED_ON: new Date(),
					CHANGED_BY: $.session.getUsername()
				};

			}
			// Verify that FROM_VALUE <= TO_VALUE
			if (oConfigBucket.TO_VALUE && oConfigBucket.FROM_VALUE && oConfigBucket.TO_VALUE < oConfigBucket.FROM_VALUE) {
				//oConfigBucket.TO_VALUE = oConfigBucket.FROM_VALUE;
				throw "Validation Error: TO_VALUE must be less than or equal to FROM_VALUE or equal to null. Received TO_VALUE: " +
					oConfigBucket
					.TO_VALUE +
					", FROM_VALUE: " + oConfigBucket.FROM_VALUE;
			}
			return Utils.getTxSavePromise(oConfigBucket, tx);
		}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "Execution Error: " + (error.message || error);
		});
	} catch (e) {
		throw "Execution Error: " + (e.message || e);
	} finally {
		pStmt.close();
	}
};

/**
 * Exit for Update Event
 * @param param
 */
function updateConfigReactionType(param) {
	$.trace.debug("Update Config Reaction Type (Use Case) exit called");
	let before = param.beforeTableName;
	let after = param.afterTableName;
	let pStmt = param.connection.prepareStatement('select * from "' + after + '"');

	// Get Input Data from OData Create
	var data = Utils.recordSetToJSON(pStmt.executeQuery(), 'ConfigBucket');
	
	// GET entity	
	var promiseImportEntities = Utils.getImportEntitiesPromise(["db::adm.config.bucketCustom", "db::adm.config.bucket"]);


	try {
		var oRow = data.ConfigBucket[0];
		promiseImportEntities.then(function(entities) {
			var ConfigBucket = entities["db::adm.config.bucketCustom"];
			var DefaultConfigBucket = entities["db::adm.config.bucket"];
			return Utils.getTxPromise([ConfigBucket, DefaultConfigBucket]);
		}).then(function(txObj) {
			return Promise.all([
				Utils.getTxFindPromise(txObj.entities[0], {
					BUCKET_ID: oRow.BUCKET_ID,
					IS_ENABLED: 1
				}, txObj.tx), //ConfigBucket
				Utils.getTxFindPromise(txObj.entities[1], {
					BUCKET_ID: oRow.BUCKET_ID,
					IS_ENABLED: 1
				}, txObj.tx), //DefaultConfigBucket
				Utils.getTxFindPromise(txObj.entities[0], {
					BUCKET_ID: oRow.BUCKET_ID,
					SEQ: oRow.SEQ
				}, txObj.tx), //ConfigBucket 
				Utils.getTxFindPromise(txObj.entities[1], {
					BUCKET_ID: oRow.BUCKET_ID,
					SEQ: oRow.SEQ
				}, txObj.tx)
			]); //DefaultConfigBucket                       
		}).then(function(aValues) {
			var oConfigBucket, oDefaultConfigBucket, oConfigBucketCurrent, oDefaultConfigBucketCurrent, tx;
			oConfigBucket = aValues[0].entities[0];
			oDefaultConfigBucket = aValues[1].entities[0];
			oConfigBucketCurrent = aValues[2].entities[0];
			oDefaultConfigBucketCurrent = aValues[3].entities[0];
			tx = aValues[0].tx;
			var newConfigBucket, newConfigBucketCurrent;
			var oHistory = {
				CHANGED_ON: new Date(),
				CHANGED_BY: $.session.getUsername()
			};
			/*
			 * Toggle Active Use Case (Reaction Type)
			 * Step 1: Get Active Use Case
			 * Step 2: Change IS_ENABLED to 0 (disable)
			 * Step 3: Save
			 */
			if (oConfigBucket) {
				oConfigBucket.IS_ENABLED = 0;
				oConfigBucket.isChanged = true;
			} else {

				newConfigBucket = {
					$entity: aValues[0].entityType,
					BUCKET_ID: oRow.BUCKET_ID,
					SEQ: oDefaultConfigBucket.SEQ,
					STR_VALUE: oDefaultConfigBucket.STR_VALUE,
					DESCRIPTION: oDefaultConfigBucket.DESCRIPTION,
					IS_ENABLED: 0,
					CHANGED_ON: new Date(),
					CHANGED_BY: $.session.getUsername(),
					REACTION_TYPE: 'NA'
				};
				newConfigBucket.isChanged = true;

			}
			/*
			 * Get Current Use Case that is being edited
			 * Step 1: Find Use Case
			 * Step 2: Set Values
			 */
			if (oConfigBucketCurrent) {
				oConfigBucketCurrent.FROM_VALUE = validValue(oRow.FROM_VALUE, oConfigBucketCurrent.FROM_VALUE);
				oConfigBucketCurrent.TO_VALUE = validValue(oRow.TO_VALUE, oConfigBucketCurrent.TO_VALUE);
				oConfigBucketCurrent.STR_VALUE = oRow.REACTION_TYPE || '',
				oConfigBucketCurrent.DESCRIPTION = validValue(oRow.DESCRIPTION, oConfigBucketCurrent.DESCRIPTION);
				oConfigBucketCurrent.IS_ENABLED = validValue(oRow.IS_ENABLED, oConfigBucketCurrent.IS_ENABLED);
				oConfigBucketCurrent.CHANGED_ON = new Date(),
				oConfigBucketCurrent.CHANGED_BY = $.session.getUsername();
				oConfigBucketCurrent.isChanged = true;
			} else {
				$.trace.debug('Create new entity: Reaction Type');

				newConfigBucketCurrent = {
					$entity: aValues[0].entityType,
					BUCKET_ID: oRow.BUCKET_ID,
					SEQ: oRow.SEQ,
					STR_VALUE: oRow.STR_VALUE,
					DESCRIPTION: oRow.DESCRIPTION,
					IS_ENABLED: oRow.IS_ENABLED,
					CHANGED_ON: new Date(),
					CHANGED_BY: $.session.getUsername(),
					REACTION_TYPE: 'NA'
				};
				newConfigBucketCurrent.isChanged = true;

			}
			$.trace.debug('Saving FilterDate');
			var aSavingEntities = [];
			if (oConfigBucket && oConfigBucket.isChanged) {
				aSavingEntities.push(oConfigBucket);
			}
			if (oConfigBucketCurrent && oConfigBucketCurrent.isChanged) {
				aSavingEntities.push(oConfigBucketCurrent);
			}
			if(newConfigBucket && newConfigBucket.isChanged) {
				aSavingEntities.push(newConfigBucket);
			}
			if (newConfigBucketCurrent && newConfigBucketCurrent.isChanged) {
				aSavingEntities.push(newConfigBucketCurrent);
			}
			return Utils.getTxSaveAllPromise(aSavingEntities, tx);
		}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "Execution Error: " + (error.message || error);
		});
	} catch (e) {
		throw "Execution Error: " + (e.message || e);
	} finally {
		pStmt.close();
	}
};

/**
 * Exit for Update Event
 * @param param
 */
function updateEventManagement(param) {
	$.trace.debug("Update EventManagement exit called");
	let before = param.beforeTableName;
	let after = param.afterTableName;
	let pStmt = param.connection.prepareStatement('select * from "' + after + '"');

	// Get Input Data from OData Create
	var data = Utils.recordSetToJSON(pStmt.executeQuery(), 'EventManagement');
	// GET Event Management
	var promiseImportEntities = Utils.getImportEntitiesPromise(["db::adm.config.event.name"]);
	try {
		var oRow = data.EventManagement[0];
		promiseImportEntities.then(function(entities) {
			var Event = entities["db::adm.config.event.name"];
			return Utils.getTxPromise([Event]);
		}).then(function(txObj) {
			return Utils.getTxFindPromise(txObj.entities[0], {
				ID: oRow.ID
			}, txObj.tx);
		}).then(function(findObj) {
			// get the first entity returned with same key & update its fields
			if (findObj.entities.length > 0) {
				var oEvent = updateEvent(findObj.entities[0], oRow);
			}
			$.trace.debug('EventManagement: Saving Entity');
			return Utils.getTxSavePromise(oEvent, findObj.tx);
		}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "Execution Error: " + (error.message || error);
		});
	} catch (e) {
		throw "Execution Error: " + (e.message || e);
	} finally {
		pStmt.close();
	}
};

function updateEvent(oEvent, oRow) {
	oEvent.DESCRIPTION = oRow.DESCRIPTION;
	oEvent.IS_ENABLED = oRow.IS_ENABLED;
	oEvent.CHANGED_ON = new Date();
	oEvent.CHANGED_BY = $.session.getUsername();
	return oEvent;
}

function validValue(oValue1, oValue2) {
	return (oValue1 != undefined) ? oValue1 : oValue2;
}