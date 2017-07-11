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
				newRapport: false,
				changeMode: false,
				annullierenVisible: false,
				confirmed: false
			});
			this.setModel(oViewModel, "rapportView");
			this.getRouter().getRoute("rapportNewRoute").attachMatched(this._onRouteMatchedNew, this);
			this.getRouter().getRoute("rapportRoute").attachMatched(this._onRouteMatchedOld, this);
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},
		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onRouteMatchedNew: function(oEvent) {
			//this._resetModel();
			this.getView().getModel("rapportView").setProperty("/newRapport", true);
			this.getView().getModel("rapportView").setProperty("/changeMode", true);
			this.getView().getModel("rapportView").setProperty("/annullierenVisible", false);
			this.getView().getModel("rapportView").setProperty("/confirmed", false);
			// Annullieren von neuen Rapporten nicht möglich
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().resetChanges();
			//var dateTime = new Date();

			this.getModel().metadataLoaded().then(function() {
				var oRapporteModel = this.getView().getModel();
				var onewRapport = oRapporteModel.createEntry("/RapporteSet");
				oRapporteModel.setProperty("Datum", new Date(), onewRapport);
				oRapporteModel.setProperty("Zeit", {
				//	ms:	( dateTime.getTime() - dateTime.getTimezoneOffset() * 60000 ), // UTC Time in Locale umrechnen
					ms: formatter.timeToLocale( new Date() ),
				//	ms: new Date().getTime(),
					__edmtype: "Edm.Time"
				}, onewRapport);
				oRapporteModel.setProperty("EniNr", sObjectId, onewRapport);
				oRapporteModel.setProperty("Lotsenname", this._getBenutzername(), onewRapport);
				// oRapporteModel.setProperty("MrbUe2000t", true, onewRapport);
				//oRapporteModel.setProperty("Bemerkung", "", onewRapport);
				var sObjectPath = onewRapport.getPath();
				this._bindView(sObjectPath);
			}.bind(this));
		},
		_onRouteMatchedOld: function(oEvent) {
			//this._resetModel();
			this.getView().getModel("rapportView").setProperty("/newRapport", false);
			this.getView().getModel("rapportView").setProperty("/changeMode", false);
			this.getView().getModel("rapportView").setProperty("/confirmed", true); // Rapport kann nur gespeichert werden wenn Flag gesetzt
			// zum Editeren von bestehenden rapporten hier aktivieren.
			this.getView().getModel("rapportView").setProperty("/annullierenVisible", true);
			// Annullieren von gespeicherten Rapporten möglich
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
				oViewModel = this.getModel("rapportView");
			//this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			var oContext = this.getView().getBindingContext();
			var oSignature = oContext.getProperty("Signatur");
			this._createSignatureModel(oSignature);
			this._createTarifModel();
			this._createSchiffsModel();
			this._createDebitorModel();
			/*if(this.getView().getModel().hasPendingChanges() && !this.getView().getModel("rapportView").getProperty("/newRapport")){
				this.getView().getModel().resetChanges();
			}*/
			this._updateTarife(); //oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
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
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		onCancel: function() {
			var oContext = this.getView().getBindingContext();
			var schiffsnr = oContext.getProperty("EniNr");
			this.onSignatureReset();
			this._destory(false);
			this.getRouter().navTo("object", {
				objectId: schiffsnr
			}, true);
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		onSave: function() {
			var error = false;
			var oRapportModel = this.getModel();
			var oContext = this.getView().getBindingContext();
			var oSignature = $("#signature");
			if (oSignature) {
				var oSignatureBase30 = oSignature.jSignature("getData", "base30");
				if (oSignatureBase30) {
					var isSignatureProvided = oSignatureBase30[1].length > 1 ? true : false;
					if (isSignatureProvided) {
						oRapportModel.setProperty("Signatur", oSignatureBase30[1], oContext);
					}
				}
			}
			var minDate = new Date();
			minDate.setDate(minDate.getDate() - 2); //Lotsenrapporte nur bis und mit Vortag erfassbar
			if (oContext.getProperty("Datum") >= new Date() || (oContext.getProperty("Datum").toDateString() === new Date().toDateString() &&
					this.formatter.time(new Date(oContext.getProperty("Zeit/ms"))) >= this.formatter.time(new Date())) // Datum in der Zukunft  

			) {

				sap.m.MessageBox.show("Der Lotsenrapport darf nicht in die Zukunft erfasst werden! \ Bitte das Datum anpassen", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Fehler" //,
						//actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						//onClose: function(oAction) { error = true; } 
				});
			} else if (oContext.getProperty("Datum") < minDate) { //Lotsenrapporte nur bis und mit Vortag erfassbar
				sap.m.MessageBox.show("Der Lotsenrapport nicht mehr als 1 Tag in die Vergangeheit erfasst werden! \ Bitte das Datum anpassen", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Fehler" //,
						//actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						//onClose: function(oAction) { error = true; } 
				});
			} else {

				if (!oContext.getProperty("Signatur") || !this.getModel("rapportView").getProperty("/confirmed")) { // 
					//!this.getView().byId("__boxCheckConfirm0").getSelected()) { // 

					sap.m.MessageBox.show("Der Lotsenrapport muss vor dem Speichern bestätigt und unterschrieben werden!", {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Fehler" //,
							//actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							//onClose: function(oAction) { error = true; } 
					});
				} else {
					
			// 					var dateTime = new Date();
			// ( dateTime.getTime() - dateTime.getTimezoneOffset() * 60000 )

					// die Zeit wird beim Lesen des Models in MS umgewandelt und muss aber beim speichern manuell in EdmTime umgewandelt werden, da das nicht wieder automatisch gemacht wird
					//oRapportModel.setProperty("Zeit", this.formatter.time(new Date( oContext.getProperty("Zeit/ms") - new Date().getTimezoneOffset() * 60000 )), oContext);
					 oRapportModel.setProperty("Zeit", this.formatter.time(new Date( oContext.getProperty("Zeit/ms")     )), oContext);
					//			oRapportModel.attachEventOnce("batchRequestCompleted", jQuery.proxy(this._submitSuccess, this));
					//			oRapportModel.attachEventOnce("batchRequestFailed", jQuery.proxy(this._submitError, this));
					oRapportModel.submitChanges({
						success: jQuery.proxy(this._submitSuccess, this),
						error: jQuery.proxy(this._submitError, this)
					});
				}
			}
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
					content: "<div style='width: 340px; height: 128px; border: 1px solid black'></d/**/iv>",
					//preferDOM : true,
					afterRendering: function(e) {
						// Init darf nur einmal aufgerufen
						if (this.init === true) {
							$("#signature").jSignature("init");
							this.init = false;
						} else {
							$("#signature").jSignature("clear");
						}
						if (this.getBindingContext()) {
							var oSignature = this.getBindingContext().getProperty("Signatur");
							if (oSignature) {
								var signatureArray = [
									"image/jsignature;base30",
									oSignature
								];
								$("#signature").jSignature("setData", "data:" + signatureArray.join(","));
							}
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
			// Ermitteln der Tarife 
			//TODO dem oData Service muss noch Datum und Uhrzeit mitgegeben werden, um den Nacht/Sonntagszuschlag automatisch zu ermitteln
			var oRapporteModel = this.getView().getBindingContext();
			var date = oRapporteModel.getProperty("Datum").toISOString().slice(0, -1);
			var time = this.formatter.time(new Date(oRapporteModel.getProperty("Zeit/ms")));
			//var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet(Datum=datetime'" + date + "',Tarifart='',Zeit=time'" + time + "')";

			var oTarifModel = this.getView().getModel("tarifeSet");
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet";
			/*		if (oRapporteModel.getProperty("ZLotsenFeiertagszuschlag")) {
						URL = URL + "('FR')";
					} else if (oRapporteModel.getProperty("Nachtzuschlag")) {
						URL = URL + "('SA')";
					} else {
						URL = URL + "('NO')";
					}*/

			var tarifArt;
			if (oRapporteModel.getProperty("ZLotsenFeiertagszuschlag")) {
				//URL = URL + "(Datum=datetime'" + date + "',Tarifart='FR',Zeit=time'" + time + "')";
				tarifArt = "FR";
			} else if (oRapporteModel.getProperty("Nachtzuschlag")) {
				//URL = URL + "(Datum=datetime'" + date + "',Tarifart='SA',Zeit=time'" + time + "')";
				tarifArt = "SA";
			} else {
				//URL = URL + "(Datum=datetime'" + date + "',Tarifart='NO',Zeit=time'" + time + "')";
				tarifArt = "NO";
			}
			var URL = URL + "(Datum=datetime'" + date + "',Tarifart='" + tarifArt + "',Zeit=time'" + time + "')";

			oTarifModel.loadData(URL, true, false);
			this.setModel(oTarifModel, "tarifeSet");
			this._calc();
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		_calc: function() {
			var oRapporteContext = this.getView().getBindingContext();
			var oRapporteModel = this.getView().getModel();
			var oTarifModel = this.getView().getModel("tarifeSet");
			// Löschen der Radiobuttons wenn Stunden bei Allgemeine Dienstleistung mitgegeben werden
			// Gemäss meeting von 27.04. darf jetzt doch eine Strecke + Allgemeine Dienstleistung zusammen in einem Rapport verrechnet werden.
			/*			if (parseInt(oRapporteContext.getProperty("AllgemeineDienstleistung"), 10) !== 0 &&
				oRapporteContext.getProperty("AllgemeineDienstleistung") !== "" &&
				oRapporteContext.getProperty("AllgemeineDienstleistung") != null) {
				this._resetRadioButtons( oRapporteModel, oRapporteContext );
			}
			// Stunden auf 0 setzen wenn Radiobutton gesetzt ist
			if (oRapporteContext.getProperty("MrbU2000t") === true ||
				oRapporteContext.getProperty("MrbUe2000t") === true ||
				oRapporteContext.getProperty("BRU125m") === true ||
				oRapporteContext.getProperty("BRSchubverband") === true ||
				oRapporteContext.getProperty("BaAug") === true ||
				oRapporteContext.getProperty("BirAug") === true) {
				oRapporteModel.setProperty("AllgemeineDienstleistung", null, oRapporteContext);
			}*/
			// rechnen des Totalbetrags
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
			if (parseFloat(oRapporteContext.getProperty("AllgemeineDienstleistung"), 10) !== 0 && oRapporteContext.getProperty(
					"AllgemeineDienstleistung") !== "" && oRapporteContext.getProperty("AllgemeineDienstleistung") != null) {
				total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/AllgemeineDienstleistung")) * parseFloat(oRapporteContext.getProperty(
					"AllgemeineDienstleistung"));
			}
			this.getView().byId("__Total").setProperty("text", total + " CHF");
		},
		_createSignatureModel: function(oSignature) {
			// Model zum handling der Signatur erzeugen
			var oSignatureModel = new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("confirmationsTitleCount ", [0]),
				noDataText: this.getResourceBundle().getText("confirmationsListNoDataText ")
			});
			this.setModel(oSignatureModel, "Signature");
			this._initSignature();
		},
		_createTarifModel: function() {
			// Model zum Lesen der Tarife erzeugen
			var oTarifModel = new JSONModel({
				busy: false,
				delay: 0
			});
			// var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet('NO')";
			this.setModel(oTarifModel, "tarifeSet");
			this._updateTarifeNewDate();
			/*			var oContext = this.getView().getBindingContext();
						var date = oContext.getProperty("Datum").toISOString().slice(0, -1);
						var time = this.formatter.time(new Date(oContext.getProperty("Zeit/ms")));
						var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet(Datum=datetime'" + date + "',Tarifart='',Zeit=time'" + time + "')";
						
						oTarifModel.loadData(URL, true, false);
						this.setModel(oTarifModel, "tarifeSet");*/
		},
		_updateTarifeNewDate: function() {
			var oTarifModel = this.getView().getModel("tarifeSet");
			var oContext = this.getView().getBindingContext();
			var date = oContext.getProperty("Datum").toISOString().slice(0, -1);
			var time = this.formatter.time(new Date(oContext.getProperty("Zeit/ms")));
			//var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
			//var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0,-1);
			//var time = this.formatter.time(new Date(oContext.getProperty("Zeit/ms")) + tzoffset );
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet(Datum=datetime'" + date + "',Tarifart='',Zeit=time'" + time + "')";
			//var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet(Datum='" + date + "',Tarifart='',Zeit='" + time + "')";
			//var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet(Datum=datetime'2017-07-01T00:00:00',Tarifart='',Zeit=time'PT07H28M45S')";

			oTarifModel.loadData(URL, true, false);

			var tarifart = oTarifModel.getProperty("/d/Tarifart");
			var oRapporteModel = this.getView().getModel();
			switch (tarifart) {
				case 'FR':
					oRapporteModel.setProperty("ZLotsenFeiertagszuschlag", true, oContext);
					oRapporteModel.setProperty("Nachtzuschlag", false, oContext);
					break;
				case 'SA':
					oRapporteModel.setProperty("Nachtzuschlag", true, oContext);
					oRapporteModel.setProperty("ZLotsenFeiertagszuschlag", false, oContext);
					break;
				default:
					oRapporteModel.setProperty("Nachtzuschlag", false, oContext);
					oRapporteModel.setProperty("ZLotsenFeiertagszuschlag", false, oContext);
					break;
			}

			this.setModel(oTarifModel, "tarifeSet");
		},
		_createSchiffsModel: function() {
			// Lesen der Schiffsdaten
			var oSchiff = new JSONModel({
				busy: false,
				delay: 0
			});
			var sSchiffsNummer = this.getView().getBindingContext().getProperty("EniNr");
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/SchiffeSet('" + sSchiffsNummer + "')";
			oSchiff.loadData(URL, true, false);
			this.setModel(oSchiff, "Schiff");
		},
		_createDebitorModel: function() {
			// Lesen der Debiorendaten zum Schiff
			var oDebitor = new JSONModel({
				busy: false,
				delay: 0
			});
			var sSchiffsNummer = this.getView().getBindingContext().getProperty("EniNr");
			var sUrlDebi = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/SchiffeSet('" + sSchiffsNummer + "')/Debitoren";
			oDebitor.loadData(sUrlDebi, true, false);
			this.setModel(oDebitor, "Debitor");
		},
		_getBenutzername: function() {
			// Ermitteln des Lotsennamens
			var oBenutzerModel = new JSONModel({
				busy: false,
				delay: 0
			});
			var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/BenutzerSet('1')";
			oBenutzerModel.loadData(URL, true, false);
			return oBenutzerModel.getProperty("/d/Firstname") + " " + oBenutzerModel.getProperty("/d/Lastname");
		},
		_destory: function(bSave) {
			// Aufräumen
			var oContext = this.getView().getBindingContext();
			var oRapportModel = this.getView().getModel();
			if (bSave === false && this.getView().getModel("rapportView").getProperty("/newRapport")) {
				oRapportModel.deleteCreatedEntry(oContext);
			}
			oRapportModel.resetChanges();
			oRapportModel.updateBindings();
			this.getView().setModel(oRapportModel);
			this.getView().getModel("tarifeSet").destroy();
			this.getView().getModel("Schiff").destroy();
			this.getView().unbindElement();
		},
		_resetModel: function(oData) {
			if (this.getView().getModel().hasPendingChanges()) {
				this.getView().getModel().resetChanges();
			}
		},
		_submitSuccess: function(oData) {
			sap.m.MessageToast.show("Rapport wurde erfolgreich gespeichert");
			this.getView().getModel("rapportView").setProperty("/newRapport", false);
			var schiffsnr = this.getView().getBindingContext().getProperty("EniNr");
			this._destory(true);
			this.getRouter().navTo("object", {
				objectId: schiffsnr
			}, true);
		},
		_submitError: function() {
			sap.m.MessageToast.show("Fehler beim speichern des Rapports");
			// 		 sap.m.MessageBox.show("Fehler beim speichern des Rapports!", {
			//     icon: sap.m.MessageBox.Icon.ERROR,
			//     title: "Fehler"//,
			//     //actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
			//     //onClose: function(oAction) { error = true; } 
			//}	
			//);
		},
		_logChange: function(sMethod) {
			if (this.getView().getModel().hasPendingChanges() || this.getView().getModel().hasPendingRequests()) {
				jQuery.sap.log.error(sMethod + " " + "Rapport: " + this.getView().getBindingContext().getProperty("Rapportid") + "SchiffNr" + this
					.getView().getBindingContext().getProperty("EniNr"));
			};
		},
		_resetRadioButtons: function(oRapporteModel, oRapporteContext) {
			oRapporteModel.setProperty("MrbU2000t", false, oRapporteContext);
			oRapporteModel.setProperty("MrbUe2000t", false, oRapporteContext);
			oRapporteModel.setProperty("BRU125m", false, oRapporteContext);
			oRapporteModel.setProperty("BRSchubverband", false, oRapporteContext);
			oRapporteModel.setProperty("BaAug", false, oRapporteContext);
			oRapporteModel.setProperty("BirAug", false, oRapporteContext);
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		onAnnullieren: function() {
			//This code was generated by the layout editor.
			var oRapportModel = this.getModel();
			var oContext = this.getView().getBindingContext();
			//oRapportModel.setProperty("Zeit", this.formatter.time(new Date(oContext.getProperty("Zeit/ms"))), oContext);
			oRapportModel.setProperty("Loevm", true, oContext);
			//			oRapportModel.attachEventOnce("batchRequestCompleted", jQuery.proxy(this._submitSuccess, this));
			//			oRapportModel.attachEventOnce("batchRequestFailed", jQuery.proxy(this._submitError, this));
			oRapportModel.submitChanges({
				success: jQuery.proxy(this._submitSuccess, this),
				error: jQuery.proxy(this._submitError, this)
			});
		},
		/**
		 *@memberOf ch.portof.controller.Rapport
		 */
		onResetSelection: function() {
			//This code was generated by the layout editor.
			var oRapporteContext = this.getView().getBindingContext();
			var oRapporteModel = this.getView().getModel();
			var oTarifModel = this.getView().getModel("tarifeSet");

			this._resetRadioButtons(oRapporteModel, oRapporteContext);
			oRapporteModel.setProperty("AllgemeineDienstleistung", null, oRapporteContext);
		}
	});
});