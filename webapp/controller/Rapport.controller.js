sap.ui.define([
	//	"sap/ui/core/mvc/Controller"
	"ch/portof/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ch/portof/model/formatter" //	], function(Controller) {
], function(BaseController, JSONModel, formatter) {
	"use strict";
	//	return Controller.extend("ch.portof.controller.Rapport", {
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
				initSignature: false
			});
			//this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			//this.getRouter().getRoute("rapport").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("rapportNewRoute").attachMatched(this._onRouteMatched, this);
			//this.getRouter().getRoute("object").attachPatternMatched(this._onRouteMatched, this);
			this.setModel(oViewModel, "rapportView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			var oTarifModel = new JSONModel({
				busy: false,
				delay: 0
			});
			//this.byId("__text30").setProperty("text", oTarifModel.getProperty("MrbU2000t"));
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet('NO')";
			oTarifModel.loadData(URL, true);
			this.setModel(oTarifModel, "tarifeSet");
			//, [oParameters], [bAsync], [sType], [bMerge], [bCache], [mHeaders])
			var oSchiffModel = new JSONModel({
				busy: false,
				delay: 0
			});


			// Signatur 
			var oSignatureModel = this._createSignatureModel();
			// oSignatureModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.setModel(oSignatureModel, "Signature");
			this._initSignature();

			var objectPath = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/"; // OrderSet('" + aufnr + "')";
			var oRapporteModel = new sap.ui.model.odata.ODataModel(objectPath, true);
			oRapporteModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			var onewRapport = oRapporteModel.createEntry("/RapporteSet");

			oRapporteModel.setProperty("/Nachtzuschlag", true, onewRapport);
			oRapporteModel.setProperty("/MrbU2000t", true, onewRapport);
			oRapporteModel.setProperty("/Datum", new Date(), onewRapport);
			oRapporteModel.setProperty("/Zeit", new Date(), onewRapport);

			//this.getView().getModel("RapporteSet").setProperty("/Datum", "22.01.2016", this.getView().getBindingContext());	
			//onewRapport.getModel().setProperty("/Nachtzuschlag", true);

			this.setModel(oRapporteModel);
			
			this.getView().setBindingContext(onewRapport);
			
			
			
			//this.getView().bindElement(onewRapport.getPath());
			//this.getView().bindElement( onewRapport );
			//this.getView().byId("startDatePicker").setDateValue(new Date());
			//this.getView().byId("startTimePicker").setDateValue(new Date());
		},
		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onRouteMatched: function(oEvent) {
			/*			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("Schiffsnummer");
					this.getRouter().navTo("rapport", {
						objectId: sObjectId
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);*/
			/*			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			oView.bindElement({
				path : "/Schiffeset(" + oArgs.objectId + ")",
				events : {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						oView.setBusy(false);
					}
				}
			});*/
			/*			var sObjectId = oEvent.getParameter("arguments").objectId;
						this.getModel().metadataLoaded().then(function() {
							var sObjectPath = this.getModel().createKey("SchiffeSet", {
								Schiffsnummer: sObjectId
							});
							this._bindView("/" + sObjectPath);
						}.bind(this));*/

			/*			var sObjectId = oEvent.getParameter("arguments").objectId;
						this.getModel().metadataLoaded().then(function() {
							var sObjectPath = this.getModel().createKey("RapporteSet", {
								Schiffsnummer: sObjectId
							});
							this._bindView("/" + sObjectPath);
						}.bind(this));*/

			/*			var sObjectPath = this.getModel().createKey("SchiffeSet", {
												Schiffsnummer: sObjectId
											});
										this._bindView("/" + sObjectPath);*/
		},
		/*		_onBindingChange: function(oEvent) {
						// No data for the binding
						if (!this.getView().getBindingContext()) {
							this.getRouter().getTargets().display("notFound");
						}
					},*/
		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ch.portof.view.Rapport
		 */
		//	onBeforeRendering: function() {
		//
		//	},
		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ch.portof.view.Rapport
		 */
		//onAfterRendering: function() {
		// http://willowsystems.github.io/jSignature/#/about/

		//},
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
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Schiffsnummer,
				sObjectName = oObject.Name,
				oViewModel = this.getModel("detailView"); //this.getOwnerComponent().oListSelector.selectAListItem(sPath);
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
			var oHistory = sap.ui.core.routing.History.getInstance();
			if (oHistory.getPreviousHash())
				window.history.go(-1);
			else
				this._oRouter.myNavBack("master", {});
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		onSave: function() {
			// This code was generated by the layout editor.
			// var oSignatureModel = this.getModel("Signature");
			// 			var oSignature = $('#signature');
			// if (oSignature) {
			// 	var oSignatureBase30 = oSignature.jSignature('getData', 'base30');
			// 	if (oSignatureBase30) {
			// 		var isSignatureProvided = oSignatureBase30[1].length > 1 ? true : false;
			// 		if (isSignatureProvided) {
			// 			var sigImage = oSignature.jSignature("getData", "image");
			// 			var saveSignatureData = {
			// 				"Aufnr": aufnr
			// 			};
			// 			saveSignatureData.SignatureMimetype = sigImage[0]; // 'image/png';
			// 			saveSignatureData.SignatureImage = sigImage[1];
			// 			// Signature data in batch List
			// 			// batchChanges.push(model.createBatchOperation("/SignatureSet('" + aufnr + "')", "PUT", saveSignatureData));
			// 		}
			// 	}
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
		_createSignatureModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("confirmationsTitleCount ", [0]),
				noDataText: this.getResourceBundle().getText("confirmationsListNoDataText ")
			});
		},
		_initSignature: function() {
			var oViewModel = this.getModel("rapportView");
			var initSignature = oViewModel.getProperty("/initSignature");
			if (initSignature === false) {
				var oSignaturePanel = this.getView().byId("signaturePanel");
				var oSignatureDiv = new sap.ui.core.HTML("signature", {
					// the static content as a long string literal
					// content: "<div style='width: 480px; height: 128px; border: 1px solid black'></d/**/iv>",
					content: "<div style='width: 480px; height: 128px; border: 1px solid black'></d/**/iv>",
					//preferDOM : true,
					afterRendering: function(e) {
						// Init darf nur einmal aufgerufen
						if (this.init === true) {
							$("#signature").jSignature("init");
							this.init = false;
						} else {
							$("#signature").jSignature("clear");
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
			//var oViewModel = this.getModel("rapportView");
			//this.getView().getModel("RapporteSet").setProperty("/Datum", "22.01.2016", this.getView().getBindingContext());
			//var oViewModel = this.getModel("RapporteSet");

			//oViewModel.getProperty("")
			//this.getView().byId("__samstagsZuschlag").getState();
			var oRapporteModel = this.getView().getBindingContext();
			//var oRapporteModel = this.getView().getModel();
			var oTarifModel = this.getView().getModel("tarifeSet");
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet";

			if (oRapporteModel.getProperty("ZLotsenFeiertagszuschlag")) {
				URL = URL + "('FR')";
			} else if (oRapporteModel.getProperty("Nachtzuschlag")) {
				URL = URL + "('SA')";
			} else {
				URL = URL + "('NO')";
			}
			
			oTarifModel.loadData(URL, true);
			
			this.setModel(oTarifModel, "tarifeSet");
			
			this._calc();
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		_calc: function() {
			//This code was generated by the layout editor.
		}
	});
});