sap.ui.define([
	"ch/portof/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ch/portof/model/formatter"
], function(BaseController, JSONModel, formatter) {
	"use strict";
	return BaseController.extend("ch.portof.controller.SignatureTestView", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ch.portof.view.SignatureTestView
		 */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				initSignature: false
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "SignatureTestView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			// Signatur 
			var oSignatureModel = this._createSignatureModel();
			this.setModel(oSignatureModel, "Signature");
			this.initSignature( );


		},
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("SignatureTestView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		onAfterRendering: function() {
			// http://willowsystems.github.io/jSignature/#/about/
		/*
			var oViewModel = this.getModel("SignatureTestView");
			var initSignature = oViewModel.getProperty("/initSignature");

			if (initSignature === false) {
				//var elementExists = document.getElementById("#signature");
				// if (elementExists === null) {
				var oSignaturePanel = this.getView().byId("signaturePanel");
				var oSignatureDiv = new sap.ui.core.HTML("signature", {
					// the static content as a long string literal
					// content: "<div style='width: 480px; height: 128px; border: 1px solid black'></div>",
					content: "<div style='width: 480px; height: 128px; border: 1px solid black'></div>",
					//preferDOM : true,
					afterRendering: function(e) {
						// Init darf nur einmal aufgerufen
						if (this.init === true) {
							$("#signature").jSignature("init");
							this.init = false;
							// $('#signature').jSignature({
							//     'signatureLine': false
							// });			
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
				$("#signature").jSignature("init");
				/*						// Init darf nur einmal aufgerufen
										if (this.init === true) {
											$("#signature").jSignature("init");
											this.init = false;
											// $('#signature').jSignature({
											//     'signatureLine': false
											// });			
										} else {
											$("#signature").jSignature("clear");
										
											
										}
				//oSignatureDiv.setVisible(true);
		
			}	*/
		},
		onSignatureReset: function() {
			var oViewModel = this.getModel("SignatureTestView"); // Model Korrigieren
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
		onRefresh: function() {
			//this.getView().byId("signaturePanel")
			sap.ui.getCore().byId("signaturePanel").rerender();
		},
		initSignature: function() {
						var oViewModel = this.getModel("SignatureTestView");
			var initSignature = oViewModel.getProperty("/initSignature");

			if (initSignature === false) {
				//var elementExists = document.getElementById("#signature");
				// if (elementExists === null) {
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
							// $('#signature').jSignature({
							//     'signatureLine': false
							// });			
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
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ch.portof.view.SignatureTestView
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ch.portof.view.SignatureTestView
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ch.portof.view.SignatureTestView
		 */
		//	onExit: function() {
		//
		//	}

	});

});