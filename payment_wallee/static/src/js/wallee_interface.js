odoo.define('payment_wallee.wallee_interface', function (require) {
    'use strict';

    var Widget = require('web.Widget');
    var Ajax = require('web.ajax');
    var Rpc = require("web.rpc");
    var Dom = require('web.dom');
    var Dialog = require("web.Dialog");
    var Config = require('web.config');
    var Core = require('web.core');
    var Qweb = Core.qweb;
    var _t = Core._t;

    $.blockUI.defaults.css.border = '0';
    $.blockUI.defaults.css["background-color"] = '';
    $.blockUI.defaults.overlayCSS["opacity"] = '0.9';

    return Widget.extend({        
        _wallee_payment_method: null,        
        xmlDependencies: ['/payment_wallee/static/src/xml/wallee_interface.xml'],
        init: function (parent, wallee_payment_method) {
            this._super.apply(this, arguments);
            this._wallee_payment_method = wallee_payment_method;
        },
        start: function() {
            this.showLoading();
            this.showWalleeInterface();
            return this._super.apply(this, arguments);
        },
        disableButton: function ($button, loader) {
        	loader = loader || undefined;
        	$button.attr('disabled', true);
        	if (loader){
        		$button.children('.fa-lock').removeClass('fa-lock');
        		$button.prepend('<span class="o_loader"><i class="fa fa-refresh fa-spin"></i>&nbsp;</span>');
        	}
        },
        enableButton: function ($button) {
        	$button.attr('disabled', false);
        	$button.children('.fa').addClass('fa-lock');
        	$button.find('span.o_loader').remove();
        },
        showWalleeInterface: function () {
            var self = this;
            if ($.blockUI) {
                var content = $(Qweb.render('wallee_interface.display_interface', {}));
                var content = $(Qweb.render("wallee_interface.display_interface"));
                self.walleehandler = null;
                var $footerbtn = null;
                var $footerconfirmbtn = null;
                var $footerclosebtn = null;
                self.dialog = new Dialog(self, {
                    title: _t("Powered By Wallee Interface"),
                    subtitle: _t(""),
                    //size: 'large',
                    $content: content,
                    buttons: [{
                        text: _t("Confirm"),
                        classes: 'btn-primary btn-confirm',
                        click: function () {  
                        	$footerconfirmbtn = self.dialog.$footer.find('.btn-primary.btn-confirm');
                        	//$footerbtn.attr("disabled", true);
                			self.disableButton($footerconfirmbtn, true);
                        	$footerclosebtn = self.dialog.$footer.find('.btn-primary.btn-close');
                			self.disableButton($footerclosebtn);
                        	if(self.walleehandler){
                        		self.walleehandler.validate();                            	                        		
                        	}
                        },
                    	close: false,
                    }, {
                        text: _t("Close"),
                        classes: 'btn-primary btn-close',
                        click: function () {  
                        	$footerclosebtn = self.dialog.$footer.find('.btn-primary.btn-close');
                        	//$footerbtn.attr("disabled", true);
                			self.disableButton($footerclosebtn, true);
                			$footerconfirmbtn = self.dialog.$footer.find('.btn-primary.btn-confirm');
                			self.disableButton($footerconfirmbtn);
                	        // window.location.href = '/shop/payment';
                            location.reload(true);
                        },
                    	close: false,
                    }],
                    dialogClass: 'wallee-payment-form-modal',
                    fullscreen: true,
                    //technical: false,
                });
                self.dialog.opened().then(function () {
                	self.dialog.$modal.find('header').find('button.close').hide();
                    var parsed_provider_form = $('form[provider="wallee"]');
                    var wallee_javascript_url = parsed_provider_form.find('input[name="wallee_javascript_url"]').val();
                    var wallee_payment_method = parsed_provider_form.find('input[name="wallee_payment_method"]').val();
                    $.getScript(wallee_javascript_url, function(data, textStatus, jqxhr) {
                		console.log( data ); // Data returned
                		console.log( textStatus ); // Success
                		console.log( jqxhr.status ); // 200
                		console.log( "Load was performed." );
                    }).done(function( script, textStatus ) {
                    	console.log("textStatus",textStatus );                   	
                    	self.walleehandler = window.IframeCheckoutHandler(wallee_payment_method);
                    	self.walleehandler.setValidationCallback(function(validationResult){                    		 
                        	self.dialog.$('ul.wallee-payment-errors').html('');  
                    		if (validationResult.success) {
                    			self.walleehandler.submit();
                    		} else {
                    			self.enableButton($footerconfirmbtn);
                    			self.enableButton($footerclosebtn);
                    			$.each(validationResult.errors, function(index, errorMessage) {
                    				self.dialog.$('ul.wallee-payment-errors').append(
                    						'&lt;li&gt;' + errorMessage + '&lt;/li&gt;');
                    			});
                    		}
                    	});
                    	self.walleehandler.setInitializeCallback(function(){
                        	console.log("setInitializeCallback");                    		
                    	});
                    	self.walleehandler.setHeightChangeCallback(function(height){
                        	console.log("setHeightChangeCallback", height);                    		
                    	});
                		var containerId = 'wallee-payment-form';
                		self.walleehandler.create(containerId);
                    }).fail(function( jqxhr, settings, exception ) {
                    	self.dialog.$('ul.wallee-payment-errors').text( "Triggered ajaxError handler." );
                    });
                });
                $.unblockUI();
                self.dialog.open();                
            }
        },
        showContent: function (xmlid, render_values) {
            var html = Qweb.render(xmlid, render_values);
            this.$el.find('.o_wallee_interface_content').html(html);
        },
        showLoading: function () {
            var msg = _t("We are processing your payments, please wait ...");
            $.blockUI({
                'message': '<h2 class="text-white"><img src="/web/static/src/img/spin.png" class="fa-pulse"/>' +
                    '    <br />' + msg +
                    '</h2>'
            });
        },
    });
});
