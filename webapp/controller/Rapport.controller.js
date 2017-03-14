sap.ui.define([
	//	"sap/ui/core/mvc/Controller"
	"ch/portof/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ch/portof/model/formatter",
	"ch/portof/controller/ErrorHandler"
], function(BaseController, JSONModel, formatter, ErrorHandler) {
	"use strict";
	return BaseController.extend("ch.portof.controller.Rapport", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ch.portof.view.Rapport
		 */
		formatter: formatter,
		onInit: function() {

			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				initSignature: false,
				newRapport: false
			});
			this.setModel(oViewModel, "rapportView");
			

			//this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			//this.getRouter().getRoute("rapport").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("rapportNewRoute").attachMatched(this._onRouteMatchedNew, this);
			this.getRouter().getRoute("rapportRoute").attachMatched(this._onRouteMatchedOld, this);
			//this.getRouter().getRoute("object").attachPatternMatched(this._onRouteMatched, this);

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			// this._createTarifModel();
			//this._createSignatureModel();
			//this._createRapportModel();
			// this._createBenutzerModel();

			/*			var oRapportModel = this.getModel();
						var oContext = this.getView().getBindingContext();
						oRapportModel.setProperty("/Datum", new Date(), oContext );
						oRapportModel.setProperty("/Zeit", formatter.time(new Date()), oContext );*/

			//			var oSchiffModel = new JSONModel( );
			//			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet('NO')";
			//			oSchiffModel.loadData(URL, true, false);
			//			this.setModel(oSchiffModel, "schiffSet");
			//	this._calc();
		},
		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onRouteMatchedNew: function(oEvent) {
			var oViewModel = this.getView().getModel("rapportView");
			oViewModel.setProperty("newRapport", true);
			var sObjectId = oEvent.getParameter("arguments").objectId;
			

			

			this.getModel().metadataLoaded().then(function() {
				var oRapporteModel = this.getView().getModel();
				var onewRapport = oRapporteModel.createEntry("/RapporteSet");
				oRapporteModel.setProperty("Datum", new Date(), onewRapport);
				oRapporteModel.setProperty("Zeit", {
					ms: new Date().getTime(),
					__edmtype: "Edm.Time"
				}, onewRapport);

				oRapporteModel.setProperty("EniNr", sObjectId, onewRapport);
				
				var sObjectPath = onewRapport.getPath();
				this._bindView(sObjectPath);
			}.bind(this));
		},
		_onRouteMatchedOld: function(oEvent) {
			var oViewModel = this.getView().getModel("rapportView");
			oViewModel.setProperty("newRapport", false);
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("RapporteSet", {
					Rapportid: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ch.portof.view.Rapport
		 */
		//	onExit: function() {
		//
		//	}	,
		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("rapportView");
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();
			// No data for the binding
			/*			if (!oElementBinding.getBoundContext()) {
							this.getRouter().getTargets().display("detailObjectNotFound");
							// if object could not be found, the selection in the master list
							// does not make sense anymore.
							this.getOwnerComponent().oListSelector.clearMasterListSelection();
							return;
						}*/
			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Schiffsnummer,
				sObjectName = oObject.Name,
				oViewModel = this.getModel("rapportView"); //this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			var oContext = this.getView().getBindingContext();
			var oSignature = oContext.getProperty("Signatur");
			
			this._createSignatureModel(oSignature);
			this._createTarifModel();
			this._createBenutzerModel();
			this._createSchiffsModel();
			this._updateTarife();

			//oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			/*oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [
				sObjectName,
				sObjectId,
				location.href
			]
			));*/

		},
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("rapportView");
			//,
			//oLineItemTable = this.byId("lineItemsList"),
			//iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			//oViewModel.setProperty("/lineItemTableDelay", 0);
			//oLineItemTable.attachEventOnce("updateFinished", function() {
			// Restore original busy indicator delay for line item table
			//	oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			//});
			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		onCancel: function() {
			//This code was generated by the layout editor.
			// history.go(-1);
			// on Nav Back 

			var oContext = this.getView().getBindingContext();
			var schiffsnr = oContext.getProperty("EniNr");
			this._destory();
			/*
			var oRapportModel = this.getView().getModel();
			if(this.getView().getModel("rapportView").getProperty(""))
			{
			oRapportModel.deleteCreatedEntry(oContext);
			}
			//oRapportModel.destroy();
			this.getView().getModel("tarifeSet").destroy();
			this.getView().getModel("benutzerSet").destroy();
			this.getView().getModel("Signature").destroy();
			this.getView().getModel("rapportView").destroy();
			//oRapportModel.destroyBindingContext(oContext);
			//this.getView().destroyContent();*/

			this.getRouter().navTo("object", {
				objectId: schiffsnr
			}, true); //this.getRouter().navTo("rapport");
			/*
			var oHistory = sap.ui.core.routing.History.getInstance();
			if (oHistory.getPreviousHash())
				window.history.go(-1);
			else
				this._oRouter.myNavBack("master", {});*/
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		onSave: function() {
			// var oViewModel = this.getView().getModel("rapportView");
			// var newRapport = oViewModel.setProperty("newRapport");

			var oRapportModel = this.getModel();
			var oContext = this.getView().getBindingContext();

			var oSignature = $('#signature');
			if (oSignature) {
				var oSignatureBase30 = oSignature.jSignature('getData', 'base30');
				if (oSignatureBase30) {
					var isSignatureProvided = oSignatureBase30[1].length > 1 ? true : false;
					if (isSignatureProvided) {
						//oRapportModel.setProperty("Signaturimage", oSignature.jSignature("getData", "image")[1], oContext);
						oRapportModel.setProperty("Signatur", oSignatureBase30[1], oContext);
					}
				}
			}

			oRapportModel.setProperty("Zeit", this.formatter.time(new Date(oContext.getProperty("Zeit/ms"))), oContext);
			//oRapportModel.setProperty("Zeit", new Date(oContext.getProperty("Zeit/ms")), oContext);
			//ErrorHandler.showError( "testfehler" );
			oRapportModel.submitChanges();
			//	{
  //success: function(oData){
  //sap.m.MessageToast.show("Rapport_showServiceError wurde erfolgreich gespeichert");
  //},
//  error: ErrorHandler.showError
				
//			});
			// if (newRapport) {
			// 	oRapportModel.destroy();
			// }
			
			
			this._destory();
			var schiffsnr = oContext.getProperty("EniNr");
			this.getRouter().navTo("object", {
				objectId: schiffsnr
			}, true);
		},
		onSignatureReset: function() {
			var oViewModel = this.getModel("rapportView");
			// Model Korrigieren
			var initSignature = oViewModel.getProperty("/initSignature");
			if (initSignature === true) {
				$("#signature").jSignature("clear");
			}
		},
		_initSignature: function() {
			var oViewModel = this.getModel("rapportView");
			var initSignature = oViewModel.getProperty("/initSignature");
			if (initSignature === false) {
				var oSignaturePanel = this.getView().byId("signaturePanel");
				var oSignatureDiv = new sap.ui.core.HTML("signature", {
					// the static content as a long string literal
					// content: "<div style='width: 480px; height: 128px; border: 1px solid black'></d/**/iv>",
					content: "<div style='width: 340px; height: 128px; border: 1px solid black'></d/**/iv>",
					//preferDOM : true,
					afterRendering: function(e) {
						// Init darf nur einmal aufgerufen
						if (this.init === true) {
							$("#signature").jSignature("init");
/*							if (oSignature) {
								var signatureArray = ["image/jsignature;base30", oSignature];
								$("#signature").jSignature("setData", "data:" + signatureArray.join(","));
							}*/
							this.init = false;
						} else {
							$("#signature").jSignature("clear");
						}
						// var oSignature = this.getView().getBindingContext().getProperty("Signatur");
						//var oContext = this.getBindingContext();
						var oSignature = this.getBindingContext().getProperty("Signatur");
						if (oSignature) {
								var signatureArray = ["image/jsignature;base30", oSignature];
								$("#signature").jSignature("setData", "data:" + signatureArray.join(","));
							}
					}
				});
				oSignatureDiv.init = true;
				if (oSignaturePanel !== null) {
					oSignatureDiv.placeAt(oSignaturePanel);
				}
				oViewModel.setProperty("/initSignature", true);
			} 
/*			else {
				//initSignature = oViewModel.getProperty("/initSignature");
				$("#signature").jSignature("clear");
				if(oSignature) {
					var signatureArray = ["image/jsignature;base30", oSignature];
					$("#signature").jSignature("setData", "data:" + signatureArray.join(",") );
				}
			}*/
		},
		_updateTarife: function() {
			var oRapporteModel = this.getView().getBindingContext();
			var oTarifModel = this.getView().getModel("tarifeSet");
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet";

			if (oRapporteModel.getProperty("ZLotsenFeiertagszuschlag")) {
				URL = URL + "('FR')";
			} else if (oRapporteModel.getProperty("Nachtzuschlag")) {
				URL = URL + "('SA')";
			} else {
				URL = URL + "('NO')";
			}

			oTarifModel.loadData(URL, true, false);

			this.setModel(oTarifModel, "tarifeSet");

			this._calc();
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		_calc: function() {
			//This code was generated by the layout editor.
			var oRapporteModel = this.getView().getBindingContext();
			//var oRapporteModel = this.getView().getModel();
			// if(!iTarifeModel){
			var oTarifModel = this.getView().getModel("tarifeSet");
			// }else{
			// 	var oTarifModel = iTarifeModel;
			// }

			var total = 0;
			if (oRapporteModel.getProperty("MrbU2000t")) {
				total = parseFloat(oTarifModel.getProperty("/d/MrbU2000t"));
			}
			if (oRapporteModel.getProperty("MrbUe2000t")) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/MrbUe2000t"));
			}
			if (oRapporteModel.getProperty("BRU125m")) {
				total = total + parseFloat(oTarifModel.getProperty("/d/BRU125m"));
			}
			if (oRapporteModel.getProperty("BRSchubverband")) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/BRSchubverband"));
			}
			if (oRapporteModel.getProperty("BaAug")) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/BaAug"));
			}
			if (oRapporteModel.getProperty("BirAug")) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/BirAug"));
			}
			if (oRapporteModel.getProperty("AllgemeineDienstleistung")) {
				total = parseFloat(total) + (parseFloat(oTarifModel.getProperty("/d/AllgemeineDienstleistung")) * parseFloat(oRapporteModel.getProperty(
					"AllgemeineDienstleistung")));
			}
			this.getView().byId("__Total").setProperty("text", total + " CHF");

		},
		_createSignatureModel: function(oSignature) {
			// Signatur 
			//var oSignatureModel = this._createSignatureModel();
			var oSignatureModel = new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("confirmationsTitleCount ", [0]),
				noDataText: this.getResourceBundle().getText("confirmationsListNoDataText ")
			});
			// oSignatureModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.setModel(oSignatureModel, "Signature");
			this._initSignature();
		},
		_createTarifModel: function() {
			var oTarifModel = new JSONModel({
				busy: false,
				delay: 0
			});
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet('NO')";
			oTarifModel.loadData(URL, true, false);
			this.setModel(oTarifModel, "tarifeSet");

		},
		_createRapportModel: function() {
			var objectPath = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/"; // OrderSet('" + aufnr + "')";
			var oRapporteModel = new sap.ui.model.odata.ODataModel(objectPath, true);
			oRapporteModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			var onewRapport = oRapporteModel.createEntry("/RapporteSet");

			oRapporteModel.setProperty("/Datum", new Date(), onewRapport);
			oRapporteModel.setProperty("/Zeit", formatter.time(new Date()), onewRapport);

			this.setModel(oRapporteModel);

			this.getView().setBindingContext(onewRapport);
		},
		_createBenutzerModel: function() {
			var oBenutzerModel = new JSONModel({
				busy: false,
				delay: 0
			});
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/BenutzerSet('1')";
			oBenutzerModel.loadData(URL, true, false);
			this.setModel(oBenutzerModel, "benutzerSet");
		},
		_destory: function() {
			var oContext = this.getView().getBindingContext();
			var schiffsnr = oContext.getProperty("EniNr");

			var oRapportModel = this.getView().getModel();
			if (this.getView().getModel("rapportView").getProperty("newRapport")) {
				oRapportModel.deleteCreatedEntry(oContext);
			} 
			//else {
			    //oRapportModel.resetChanges();
			//}
			//oRapportModel.destroy();
			this.getView().getModel("tarifeSet").destroy();
			this.getView().getModel("benutzerSet").destroy();
			this.getView().getModel("Schiff").destroy();
		},
		_createSchiffsModel:function() {
			//var oSchiff = this.getModel("Schiff");
						 var oSchiff = new JSONModel({
			 	busy: false,
				delay: 0
			 });
			//var oSchiff = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZLOTSENAPP2_SRV/");
			//this.setModel(oSchiff, "Schiff");
			var sSchiffsNummer = this.getView().getBindingContext().getProperty("EniNr");

			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/SchiffeSet('" + sSchiffsNummer + "')";
			oSchiff.loadData(URL, true, false);

			this.setModel(oSchiff, "Schiff");
		}
	});
});