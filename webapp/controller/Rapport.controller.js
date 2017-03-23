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
			//jQuery.sap.log.setLevel(someLevel, "myContext");
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				initSignature: false,
				newRapport: false,
				changeMode: false
				
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
			// this._getBenutzername();

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
			this._logChange("_onRouteMachednew Start");
			//this._resetModel();
			this.getView().getModel("rapportView").setProperty("/newRapport", true);
			this.getView().getModel("rapportView").setProperty("/changeMode", true);
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
				oRapporteModel.setProperty("Lotsenname", this._getBenutzername(), onewRapport);
				
				var sObjectPath = onewRapport.getPath();
				this._bindView(sObjectPath);
			}.bind(this));
			this._logChange("_onRouteMachedOld End");
		},
		_onRouteMatchedOld: function(oEvent) {
		this._logChange("_onRouteMachedOld Start");
			//this._resetModel();
			this.getView().getModel("rapportView").setProperty("/newRapport", false);
			this.getView().getModel("rapportView").setProperty("/changeMode", true); // zum Editeren von bestehenden rapporten hier aktivieren.

			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("RapporteSet", {
					Rapportid: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		this._logChange("_onRouteMachedOld End");
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
			this._logChange("_bindview Start");
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
			//this._logChange("_bindview End");
		},
		_onBindingChange: function() {
			//this._logChange("onBindingChanged Start");
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
			this._createSchiffsModel();
			this._createDebitorModel();

			/*if(this.getView().getModel().hasPendingChanges() && !this.getView().getModel("rapportView").getProperty("/newRapport")){
				this.getView().getModel().resetChanges();
			}*/

			this._updateTarife();
			//this._logChange("onBindingChanged end");

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
			//this._logChange("onMetadataLoaded");
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
			this._destory(false);
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
			this._logChange("onCancel");
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
			this._logChange("onSave Start");
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

//			oRapportModel.attachEventOnce("batchRequestCompleted", jQuery.proxy(this._submitSuccess, this));
//			oRapportModel.attachEventOnce("batchRequestFailed", jQuery.proxy(this._submitError, this));
			
			oRapportModel.submitChanges( 
				{
				success: jQuery.proxy(this._submitSuccess, this),
				error: jQuery.proxy(this._submitError, this)
			} 
			);
			this._logChange("onSave End");
//			oRapportModel.att;
			//this._submitSuccess();
			//var oContext = this.getBindingContext();
			//var schiffsnr = oContext.getProperty("EniNr");
/*			this.getView().getModel("rapportView").setProperty("/newRapport", false);

			var schiffsnr = oContext.getProperty("EniNr");
			this._destory();

			this.getRouter().navTo("object", {
				objectId: schiffsnr
			}, true);
*/
			//	{
			//success: function(oData){
			//sap.m.MessageToast.show("Rapport_showServiceError wurde erfolgreich gespeichert");
			//},
			//  error: ErrorHandler.showError

			//			});
			// if (newRapport) {
			// 	oRapportModel.destroy();
			// }

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
		},
		_updateTarife: function() {
			this._logChange("_updateTarife Begin");
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

						this._logChange("_updateTarife End");
			this._calc();

		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		_calc: function() {
			this._logChange("_calc Begin");
			//This code was generated by the layout editor.
			var oRapporteContext = this.getView().getBindingContext();
			var oRapporteModel = this.getView().getModel();
			// if(!iTarifeModel){
			var oTarifModel = this.getView().getModel("tarifeSet");
			// }else{
			// 	var oTarifModel = iTarifeModel;
			// }
			if (parseInt(oRapporteContext.getProperty("AllgemeineDienstleistung"), 10) !== 0 &&
				oRapporteContext.getProperty("AllgemeineDienstleistung") !== "" &&
				oRapporteContext.getProperty("AllgemeineDienstleistung") != null) {
				oRapporteModel.setProperty("MrbU2000t", null, oRapporteContext);
				oRapporteModel.setProperty("MrbUe2000t", null, oRapporteContext);
				oRapporteModel.setProperty("BRU125m", null, oRapporteContext);
				oRapporteModel.setProperty("BRSchubverband", null, oRapporteContext);
				oRapporteModel.setProperty("BaAug", null, oRapporteContext);
				oRapporteModel.setProperty("BirAug", null, oRapporteContext);
			}

			if (oRapporteContext.getProperty("MrbU2000t") === true ||
				oRapporteContext.getProperty("MrbUe2000t") === true ||
				oRapporteContext.getProperty("BRU125m") === true ||
				oRapporteContext.getProperty("BRSchubverband") === true ||
				oRapporteContext.getProperty("BaAug") === true ||
				oRapporteContext.getProperty("BirAug") === true) {
				oRapporteModel.setProperty("AllgemeineDienstleistung", null, oRapporteContext);
			}

			var total = 0;
			if (oRapporteContext.getProperty("MrbU2000t")) {
				total = parseFloat(oTarifModel.getProperty("/d/MrbU2000t"));
			}
			if (oRapporteContext.getProperty("MrbUe2000t")) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/MrbUe2000t"));
			}
			if (oRapporteContext.getProperty("BRU125m")) {
				total = total + parseFloat(oTarifModel.getProperty("/d/BRU125m"));
			}
			if (oRapporteContext.getProperty("BRSchubverband")) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/BRSchubverband"));
			}
			if (oRapporteContext.getProperty("BaAug")) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/BaAug"));
			}
			if (oRapporteContext.getProperty("BirAug")) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/BirAug"));
			}
			// if (oRapporteContext.getProperty("AllgemeineDienstleistung")) {
			if (
				parseInt(oRapporteContext.getProperty("AllgemeineDienstleistung"), 10) !== 0 &&
				oRapporteContext.getProperty("AllgemeineDienstleistung") !== "" &&
				oRapporteContext.getProperty("AllgemeineDienstleistung") != null
			) {
				total = parseFloat(total) + (parseFloat(oTarifModel.getProperty("/d/AllgemeineDienstleistung")) * 
						parseFloat(oRapporteContext.getProperty("AllgemeineDienstleistung")));
			}

			this.getView().byId("__Total").setProperty("text", total + " CHF");
			this._logChange("_calc End");
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
		_getBenutzername: function() {
			var oBenutzerModel = new JSONModel({
				busy: false,
				delay: 0
			});
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/BenutzerSet('1')";
			oBenutzerModel.loadData(URL, true, false);
			//this.setModel(oBenutzerModel, "benutzerSet");
			return oBenutzerModel.getProperty("/d/Firstname") + " " + oBenutzerModel.getProperty("/d/Lastname");
		},
		_destory: function(bSave) {
			var oContext = this.getView().getBindingContext();
			//var schiffsnr = oContext.getProperty("EniNr");

			var oRapportModel = this.getView().getModel();
			if ( bSave === false && this.getView().getModel("rapportView").getProperty("/newRapport")) {
				oRapportModel.deleteCreatedEntry(oContext);
			}

			//oRapportModel.batchRequestCompleted().then(this._onMetadataLoaded.bind(   
			oRapportModel.resetChanges( 
			// {   
			// 	fnSuccess: this._resetSuccess,
			// 	fnError: this._resetError
			// } 
			);
			oRapportModel.refresh();
			oRapportModel.updateBindings();

			jQuery.sap.log.error( "ResetChange" + " " +  "Rapport: " + this.getView().getBindingContext().getProperty("Rapportid") + "SchiffNr" + this.getView().getBindingContext().getProperty("EniNr")  );
			this._logChange("_destory Middle");
				
/*				{fnSuccess: function(oData){
					sap.m.MessageToast.show("resetChange erfolgreich");
				} ,
				fnError: function(oData){ sap.m.MessageToast.show("resetChange Fehler");
				}
				});*/
			//oRapportModel.updateBindings();
			//oRapportModel.refresh();
			//));

			this.getView().setModel(oRapportModel);
			
			this.getView().getModel("tarifeSet").destroy();
			//this.getView().getModel("benutzerSet").destroy();
			this.getView().getModel("Schiff").destroy();
			this._logChange("_destory End");
			//this.getView().unbindElement();
			//this._logChange("_destory after unbind");
		},
		_createSchiffsModel: function() {

			// var oSchiff = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZLOTSENAPP2_SRV/");
			// var sSchiffsNummer = this.getView().getBindingContext().getProperty("EniNr");
			
			
			//var URL = "SchiffeSet('" + sSchiffsNummer + "')";
			
			// var sObjectPath = "/" + this.getModel().createKey("SchiffeSet", {
			// 	Schiffsnummer: sSchiffsNummer
			// });
			
			//oSchiff.read(sObjectPath, {success: this._resetSuccess, error:this._resetError});
			
			// oSchiff.createBindingContext(sObjectPath, { fnCallBack: this._resetSuccess } );
			// var context2 = this.getView().getModel().createBindingContext(sObjectPath, { fnCallBack: this._resetSuccess });
			// this.setModel(oSchiff, "Schiff");
			//this.setModel
			
			
			
			
			//var oSchiff = this.getModel("Schiff");
			var oSchiff = new JSONModel({
				busy: false,
				delay: 0
			});
			var sSchiffsNummer = this.getView().getBindingContext().getProperty("EniNr");

			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/SchiffeSet('" + sSchiffsNummer + "')";
			oSchiff.loadData(
				 URL,				true,
				false
			);

			this.setModel(oSchiff, "Schiff");
		},
		
		_createDebitorModel: function() {
			var oDebitor= new JSONModel({
				busy: false,
				delay: 0
			});
			var sSchiffsNummer = this.getView().getBindingContext().getProperty("EniNr");

			var sUrlDebi = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/SchiffeSet('" + sSchiffsNummer + "')/Debitoren";
			oDebitor.loadData(
				 sUrlDebi,				true,
				false
			);

			this.setModel(oDebitor, "Debitor");
		},
		_resetModel: function(oData) {
			if (this.getView().getModel().hasPendingChanges()) {
				this.getView().getModel().resetChanges();
			}
		},
		_submitSuccess: function(oData) {
//			sap.m.MessageToast.show("Rapport wurde erfolgreich gespeichert");
						//var oContext = this.getBindingContext();
			this.getView().getModel("rapportView").setProperty("/newRapport", false);

			var schiffsnr = this.getView().getBindingContext().getProperty("EniNr");
			this._destory( true );

			this.getRouter().navTo("object", {
				objectId: schiffsnr
			}, true);

			//var oRapportModel = this.getModel();
			//var oContext = this.getView().getBindingContext();
			//this.getView().getModel("rapportView").setProperty("newRapport", false );
			/*var oContext = this.getBindingContext();
			this.getModel("rapportView").setProperty("newRapport", false );
			
			var schiffsnr = oContext.getProperty("EniNr");			
			this._destory();

			this.getRouter().navTo("object", {
				objectId: schiffsnr
			}, true);*/
		},
		_submitError: function() {
			sap.m.MessageToast.show("FEHLER!!!!!!!!!!!!!!!!!");
			
						//var oContext = this.getBindingContext();
		/*	this.getView().getModel("rapportView").setProperty("/newRapport", false);

			var schiffsnr = this.getView().getBindingContext().getProperty("EniNr");
			this._destory( true );

			this.getRouter().navTo("object", {
				objectId: schiffsnr
			}, true);*/

		},
		_resetSuccess: function(oContext) {
				//this.setModel(oData, "Schiff");
				//this.getView().setBindingContext(oContext, "Schiff");
				sap.m.MessageToast.show("OK!!!!!!!!!!!!!!!!!");
				jQuery.sap.log.error( "ResetSucces" + " " +  "Rapport: " + this.getView().getBindingContext().getProperty("Rapportid") + "SchiffNr" + this.getView().getBindingContext().getProperty("EniNr")  );
			
		},
		_resetError: function() {
			sap.m.MessageToast.show("FEHLER!!!!!!!!!!!!!!!!!");
			jQuery.sap.log.error( "ResetError" + " " +  "Rapport: " + this.getView().getBindingContext().getProperty("Rapportid") + "SchiffNr" + this.getView().getBindingContext().getProperty("EniNr")  );
			},
			
		_logChange: function(sMethod) {
			//this.getView().getModel().hasPendingChanges()
			//if (this.getView().getModel()){
			if(this.getView().getModel().hasPendingChanges() || this.getView().getModel().hasPendingRequests()){
				//this.console.log( sMethod + " " +  "Rapport: " + this.getView().getBindingContext().getProperty("RapportNr") + "SchiffNr" + this.getView().getBindingContext().getProperty("RapportNr")  );
				jQuery.sap.log.error( sMethod + " " +  "Rapport: " + this.getView().getBindingContext().getProperty("Rapportid") + "SchiffNr" + this.getView().getBindingContext().getProperty("EniNr")  );
				
			};
			//}
			
		}
	});
});