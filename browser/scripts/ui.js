// require ui-core.js

VizorUI.prototype.setupEventHandlers = function(e2, dom) {
	if (typeof e2 === 'undefined') return false;

	dom = dom || this.dom;
	e2.app.openPresetSaveDialog = this.openPresetSaveDialog.bind(e2.app);

	var that = this;


	dom.btnAssets.click(this.onBtnAssetsClicked.bind(this));
	dom.btnPresets.click(this.onBtnPresetsClicked.bind(this));
	dom.btnChatDisplay.click(this.onBtnChatClicked.bind(this));
	dom.btnHideAll.click(this.onBtnHideAllClicked.bind(this));
	dom.btnInspector.click(this.onBtnInspectorClicked.bind(this));
	dom.btnEditorCam.click(this.enterEditorView.bind(this));
	dom.btnVRCam.click(this.enterVRView.bind(this));


	var setModeBuild = this.setModeBuild.bind(this),
	setModeProgram = this.setModeProgram.bind(this)
	dom.btnBuildMode.click(setModeBuild);
	dom.btnProgramMode.click(setModeProgram);
	dom.presetsLib.find('a[href="#objects"]').click(setModeBuild)
	dom.presetsLib.find('a[href="#presets"]').click(setModeProgram)

	var makeTabHandler = function(panelStateKey) {
		return function(e) {
			if (e) {
				e.preventDefault();
			}
			var $a = jQuery(e.currentTarget);
			var $li = $a.parent();	// e.g. dom.tabObjects, dom.tabPresets, etc.
			if ($li.hasClass('disabled')) return true;
			var s = this.state.panelStates[panelStateKey];
			var stateChanged = false;
			if (s.collapsed) {
				s.collapsed = false;
				stateChanged = true;
			}
			if (!$li.hasClass('active')) {
				s.selectedTab = '#' + e.currentTarget.href.split('#')[1];	// link
				stateChanged = true;
			}
			if (stateChanged)
				this.state.panelStates[panelStateKey] = s;
			return false;
		}.bind(that);
	};

	dom.chatWindow.find('ul.nav-tabs a').click(makeTabHandler('chat'));
	dom.presetsLib.find('ul.nav-tabs a').click(makeTabHandler('presets'));
	dom.propertiesPanel.find('ul.nav-tabs a').click(makeTabHandler('properties'));

	if (dom.assetsLib) dom.assetsLib.find('ul.nav-tabs a').click(makeTabHandler('assets'));

	var makeCollapseHandler = function(panelStateKey) {
		return function(e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			var newState = this.state.panelStates[panelStateKey] || {}
			newState.collapsed = !newState.collapsed
			this.state.panelStates[panelStateKey] = newState
			return false;
		}.bind(that);
	};
	dom.chatToggleButton.click(makeCollapseHandler('chat'));
	dom.assetsToggle.click(makeCollapseHandler('assets'));
	dom.presetsToggle.click(makeCollapseHandler('presets'));
	dom.propertiesToggle.click(makeCollapseHandler('properties'));

	dom.assetsClose.click(this.closePanelAssets.bind(this));
	dom.presetsClose.click(this.closePanelPresets.bind(this));
	dom.chatClose.click(this.closePanelChat.bind(this));
	dom.propertiesClose.click(this.closePanelProperties.bind(this));

	dom.publishButton.click(function() {
		E2.app.onPublishClicked()
	});

	var updatePanelState = function(which, domElement) {
		that.state.panelStates[which] = VizorUI.getDomPanelState(domElement);
	}
	// drag handlers, for when the panels are dragged
	dom.propertiesPanel.on(uiEvent.moved, function(){  updatePanelState('properties', dom.propertiesPanel)   });
	dom.assetsLib.on(uiEvent.moved, function(){  updatePanelState('assets', dom.assetsLib)   });
	dom.presetsLib.on(uiEvent.moved, function(){ updatePanelState('presets', dom.presetsLib) });
	dom.chatWindow
		.on(uiEvent.moved, function() {
			updatePanelState('chat', dom.chatWindow)
		})
		.on(uiEvent.resized, function(){
			updatePanelState('chat', dom.chatWindow);
		})
		.find('.resize-handle')
		.on('mousemove touchmove', that.onChatResize.bind(that))

	var switchModifyMode = function(modifyMode){
		return function(e){
			e.preventDefault()
			e.stopPropagation()
			var state = that.state
			state.modifyModeDefault = modifyMode
			state.modifyMode = state.modifyModeDefault
			return false
		}
	}
	dom.btnMove.on('mousedown', switchModifyMode(uiModifyMode.move));
	dom.btnRotate.on('mousedown', switchModifyMode(uiModifyMode.rotate));
	dom.btnScale.on('mousedown', switchModifyMode(uiModifyMode.scale));

};


VizorUI.prototype.init = function(e2) {	// normally the global E2 object
	e2.app.onWindowResize();

	this._init(e2);

	var that = this;
	var dom = this.dom;

	dom.propertiesPanel = $('#properties-panel');
	dom.propertiesClose = $('#properties-close', dom.propertiesPanel)
	dom.propertiesToggle = $('#properties-toggle', dom.propertiesPanel)

	this.state.panelStates.assets = VizorUI.getDomPanelState(dom.assetsLib);
	this.state.panelStates.presets = VizorUI.getDomPanelState(dom.presetsLib);
	this.state.panelStates.chat = VizorUI.getDomPanelState(dom.chatWindow);
	this.state.panelStates.properties = VizorUI.getDomPanelState(dom.propertiesPanel);


	dom.btnBuildMode = $('#buildModeBtn');
	dom.btnProgramMode = $('#programModeBtn');
	dom.btnMove = $('#btn-move');
	dom.btnScale = $('#btn-scale');
	dom.btnRotate = $('#btn-rotate');
	dom.btnHideAll = $('#btn-hide-all');



	var presetsTabs = jQuery('#presets-lib div.block-header ul.nav-tabs li');
	dom.tabPresets = presetsTabs.find("a[href='#presets']").parent();
	dom.tabObjects = presetsTabs.find("a[href='#objects']").parent();


	var propertiesTabs = jQuery('#properties-panel div.block-header ul.nav-tabs li');
	dom.tabObjProperties = propertiesTabs.find("a[href='#obj3dPropertiesPane']").parent();
	dom.tabNodeProperties = propertiesTabs.find("a[href='#nodePropertiesPane']").parent();

	var shaderBlock = $('.shader-block')
	shaderBlock.movable()

	// drag dragging handlers
	dom.presetsLib.movable();
	dom.assetsLib.movable();
	dom.propertiesPanel.movable();

	var chatUsersHeight = jQuery('.chat-users').height();

	var bottomPanelHeight = jQuery('.bottom-panel').height();
	var editorHeaderHeight = jQuery('.editor-header').height();
	var breadcrumbHeight = jQuery('#breadcrumb').height();
	var chatTop = $(window).height() - chatUsersHeight - bottomPanelHeight - 40;

	if (chatTop < (editorHeaderHeight + breadcrumbHeight)) {
		chatTop = breadcrumbHeight + breadcrumbHeight + 40;
	}
	dom.chatWindow.css({'top': chatTop});
	dom.chatWindow.movable();

	this.initDropUpload();
	this.setPageTitle();


	dom.structure.addClass('scrollbar'); // #805
	dom.menubar = jQuery('div.menu-bar')

	VizorUI.replaceSVGButtons(dom.menubar);
	VizorUI.replaceSVGButtons(jQuery('#row2'));

	this.state.recall();

	if (dom.assetsLib.length < 1) this.state.visibility.panel_assets = false;

	this.setupEventHandlers(e2,this.dom);

	this.propertiesPanel = {
		obj3d : new UIObjectProperties(jQuery('#obj3dPropertiesPane', dom.propertiesPanel)),
		node :  new UINodeProperties(jQuery('#nodePropertiesPane', dom.propertiesPanel))
	}

	this.setupStateStoreEventListeners();
	this.state.allowStoreOnChange = true;

	this.pluginDocsCache = new PluginDocsCache()

	this._initialised = true;
	this.emit(uiEvent.initialised, this);
}



/***** LOADING *****/
VizorUI.prototype.setLoadingStatus = function(is_loading) {}
VizorUI.prototype.hideLoadingIndicator = function() {
	this.updateProgressBar(100);
}
VizorUI.prototype.showLoadingIndicator = function() {
	this.updateProgressBar(10);
}

VizorUI.prototype.setPageTitle = function() {
	var isLoggedIn = E2.models.user.get('username');
	if (!isLoggedIn)
		return false;

	var graphname = E2.app.path;
	var newTitle = "Vizor";

	graphname = graphname.split('/')
	if (graphname.length > 1)
		graphname=graphname[1];
	
	newTitle = graphname + " | " + newTitle;	
	document.title = newTitle;
	return newTitle;
}

/***** EVENT HANDLERS *****/

VizorUI.prototype.onSearchResultsChange = function($libContainer) {
  var presetsPanel = E2.dom.presetsLib;
  var $activeLib = $libContainer || presetsPanel.find('.tab-pane.active');
  var resultsCount = $('.result.table tbody', $activeLib).children().length;
	var $list = $activeLib.find('.preset-list-container');
	var maxHeight = $list.css('maxHeight');
	if (resultsCount>0) {
		presetsPanel.removeClass('collapsed');
		$list.show();
		var resultsHeight = $('.result.table', $activeLib).outerHeight(true);
		var newHeight = resultsHeight;
		newHeight = ( newHeight >= maxHeight ) ? (maxHeight) : (newHeight);
		presetsPanel.height('auto');
		$list.height(newHeight);
	}
	 else {
		presetsPanel.height('auto');
		$list.height(maxHeight);
	}
};


VizorUI.prototype.onBtnHideAllClicked = function(e) {
	e.preventDefault();
	this.toggleFloatingPanels();
	return false;
}

VizorUI.prototype.onBtnChatClicked = function(e) {
	this.state.visibility.panel_chat = !this.state.visibility.panel_chat;
	return false;
}

VizorUI.prototype.onBtnPresetsClicked = function() {
	this.state.visibility.panel_presets = !this.state.visibility.panel_presets;
	return false;
}

VizorUI.prototype.onBtnInspectorClicked = function() {
	this.state.visibility.panel_properties = !this.state.visibility.panel_properties
	return false
}

VizorUI.prototype.onBtnAssetsClicked = function() {
	this.state.visibility.panel_assets = !this.state.visibility.panel_assets;
	return false;
}


/***** TOGGLE LAYERS OF THE UI ON OR OFF *****/
VizorUI.prototype.toggleFloatingPanels = function(forceVisibility) {
	var v = this.state.visibility;
	if (typeof forceVisibility !== 'undefined')
		v.floating_panels = forceVisibility;
	else
		v.floating_panels = !v.floating_panels;
};

VizorUI.prototype.togglePatchEditor = function(forceVisibility) {
	var v = this.state.visibility;
	if (typeof forceVisibility !== 'undefined')
		v.patch_editor = forceVisibility;
	else
		v.patch_editor = !v.patch_editor;
}

VizorUI.prototype.toggleUILayer = function() {
	this.state.visible = !this.state.visible;
}

VizorUI.prototype.enterEditorView = function(e) {
	this.state.viewCamera = uiViewCam.birdsEye
	if (e) e.preventDefault()
	return true;
}
VizorUI.prototype.enterVRView = function(e) {
	this.state.viewCamera = uiViewCam.vr
	if (e) e.preventDefault()
	return true;
}

VizorUI.prototype.onChatResize = function() {
	var dom = this.dom;
	var $chatPanel = dom.chatWindow;

	var panelHeight = $chatPanel.outerHeight(true);
	if (panelHeight < 180) {
		panelHeight = 180;
		$chatPanel.height(panelHeight);
	}
	var chatParentHeight = $chatPanel.parent().height();
	if (panelHeight > chatParentHeight) {
		$chatPanel.height(chatParentHeight - 10);
	}

	panelHeight = $chatPanel.outerHeight(true);
	var dragHandleHeight = $chatPanel.find('.drag-handle').height();
	var tabsHeight = dom.chatTabs.height();

	$chatPanel.find('.tab-content .tab-pane').height(panelHeight - dragHandleHeight - tabsHeight)
};


VizorUI.prototype.closePanelChat = function() {
	this.state.visibility.panel_chat = false;
	return false;
}

VizorUI.prototype.closePanelProperties = function() {
	this.state.visibility.panel_properties = false;
	return false;
}

VizorUI.prototype.closePanelAssets = function() {
	this.state.visibility.panel_assets = false;
	return false;
}

VizorUI.prototype.closePanelPresets = function() {
	this.state.visibility.panel_presets = false;
	return false;
}

VizorUI.prototype.onTreeClicked = function(e) {	// currently unused
	var s = this.state.panelStates.presets || {};
	s.selectedTab = '#graph';
	this.state.panelStates.presets = s;
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}
	return false;
}

VizorUI.prototype.onLibSearchClicked = function(e) {
	var $input = jQuery(e.target);
	var currentLib = $input.parents('.vp-library');
	if (currentLib.hasClass('collapsed')) {
		currentLib.removeClass('collapsed')
		this.onSearchResultsChange();
	}
	return false;
}

VizorUI.prototype.isPanelChatVisible = function() {
	return this.state.visibility.panel_chat
}
VizorUI.prototype.isPanelPresetsVisible = function() {
	return this.state.visibility.panel_presets
}
VizorUI.prototype.isPanelAssetsVisible = function() {
	return this.state.visibility.panel_assets
}
VizorUI.prototype.isPanelPropertiesVisible = function() {
	return this.state.visibility.panel_properties
}

VizorUI.prototype.togglePanelChatCollapsed = function() {
	this.dom.chatToggleButton.trigger('click');
}
VizorUI.prototype.togglePanelAssetsCollapsed = function() {
	this.dom.assetsToggle.trigger('click');
}
VizorUI.prototype.togglePanelPresetsCollapsed = function() {
	this.dom.presetsToggle.trigger('click');
}
VizorUI.prototype.togglePanelPropertiesCollapsed = function() {
	this.dom.propertiesToggle.trigger('click');
}

VizorUI.prototype.openPresetSaveDialog = function(serializedGraph) {

	var that = this;	// e2.app
	var ui = E2.ui;

	var presetDialog = function() {

		var username = E2.models.user.get('username');
		var presetsPath = '/'+username+'/presets/'

		ui.updateProgressBar(65);

		$.get(presetsPath, function(files) {
			var fsc = new FileSelectControl()
			.frame('save-frame')
			.template('preset')
			.buttons({
				'Cancel': function() {
					ui.updateProgressBar(100);
				},
				'Save': function(name) {
					if (!name)
					{
						bootbox.alert('Please enter a name for the preset');
						return false;
					}

					serializedGraph = serializedGraph || that.player.core.serialise()

					$.ajax({
						type: 'POST',
						url: presetsPath,
						data: {
							name: name,
							graph: serializedGraph
						},
						dataType: 'json',
						success: function() {
							ui.updateProgressBar(100);
							mixpanel.track('Preset Saved')
							that.presetManager.refresh()
						},
						error: function(x, t, err) {
							ui.updateProgressBar(100);

							// since we ask first thing above
							// if (x.status === 401)
							//	return E2.controllers.account.openLoginModal();

							if (x.responseText)
								bootbox.alert('Save failed: ' + x.responseText);
							else
								bootbox.alert('Save failed: ' + err);
						}
					});
				}
			})
			.files(files)
			.on('closed', function(){
				ui.updateProgressBar(100);
			})
			.modal();

			return fsc;
		})
	};

	if (!VizorUI.userIsLoggedIn()) {
		return VizorUI.openLoginModal().then(presetDialog);
	}

	return presetDialog();
};

VizorUI.prototype.setModeBuild = function() {
	this.state.mode = uiMode.build
	return true;
};
VizorUI.prototype.setModeProgram = function() {
	this.state.mode = uiMode.program
	return true;
};

VizorUI.prototype.buildBreadcrumb = function(graph, beforeRender) {
	var b = new UIbreadcrumb()
	function buildBreadcrumb(parentEl, graph, add_handler) {
		var title = graph.tree_node.title || graph.tree_node.id
		if (add_handler) {
			b.prepend(title, null, function() { graph.tree_node.activate() })
		} else {
			b.prepend(title, null)
		}
		if (graph.parent_graph)
			buildBreadcrumb(parentEl, graph.parent_graph, true)
	}
	buildBreadcrumb(this.dom.breadcrumb, graph, false)

	if (typeof beforeRender === 'function') beforeRender(b);
	b.render(this.dom.breadcrumb)
	return b;
}

VizorUI.prototype.toggleFullscreenVRViewButtons = function() {
	var vr = false; // place E2 VR device check here;
	E2.dom.fscreen.parent.toggle(!vr);
	E2.dom.vrview.parent.toggle(vr);
}


/***** UI MODALS/DIALOGS *****/



VizorUI.prototype.openPublishGraphModal = function() {
	var that = this,
		dfd = when.defer(),
		publishTemplate = E2.views.filebrowser.publishModal

	var graphname = E2.app.path.split('/')
    if (graphname.length > 1)
        graphname = graphname[1]

	var graphdata = E2.app.player.core.serialise()
	var graphpreview = E2.app.getScreenshot(1280, 720)
	var assetdata = _.clone(E2.app.graphStore.getGraphSize())	// {size, numAssets, numNodes, hasAudio}


	var data = {
		path:	        graphname,
		graph:	        graphdata,
		previewImage:   graphpreview,
		assetdata:		assetdata,
		isPublic:		true,
		sizeFormatted: 	siteUI.formatFileSize(assetdata.size)
	}


	var openSaveGraph = function(dfd) {

		ga('send', 'event', 'account', 'open', 'publishGraphModal')
		var $modal = VizorUI.modalOpen(publishTemplate(data), 'Publish', 'nopad modal_publish')
		var $form = $('#publishGraphForm', $modal)
		VizorUI.setupXHRForm($form, function(saved) {
			ga('send', 'event', 'graph', 'saved')
			dfd.resolve(saved.path)
		})

		var $publicPrivateLabel = $form.find('label#publishPublicPrivateLabel').first()
		$form.find('input#publishPublic')
			.on('change', function(e){
				var isPublic = this.checked
				$publicPrivateLabel.html( isPublic ? 'Public' : 'Private')
			})

		var $pathInput = $('#pathInput', $form),
			$submit = $form.find('button[type="submit"]'),
			$submitLabel = $submit.find('span'),
			$message = $form.find('.modal-error')

		var canSubmit = false

		var makeGraphUrl = function(username, pathInputValue) {
			return '/' + username + '/' + E2.util.slugify(pathInputValue)
		}

		var t = null, done_t = null

		var checkGraphExists = function(path) {
			canSubmit = false

			if (done_t)
				clearTimeout(done_t)		// set by the response handler

			var username = E2.models.user.toJSON().username
			$submit.attr('disabled', true)

			var url = makeGraphUrl(username, path) + '?summary=1'

			var responseHandler = function(status, json){
				var delay = 0
				var okToSubmit = true	// default
				switch (status) {
					case 0:
						okToSubmit = false
						// fallthrough
					case 404:
						// clear warnings
						$message
							.html('')
							.removeClass('warn')
							.hide()
						$form
							.removeClass('hasMessage keepMessage')
							.addClass('noMessage')
						$submitLabel
							.text('Publish')
						break
					case 200:
						// warn the user and change the button
						$form
							.removeClass('noMessage')
							.addClass('hasMessage keepMessage')
						$message
							.html('That file already exists. Do you want to update it with this copy?')
							.addClass('warn')
							.show()
						$submitLabel
							.text('Yes, publish')
						delay = 1000
						break
					default:
						console.error('could not parse response', status, json)
				}

				function done() {
					// set upper scope to our result
					canSubmit = okToSubmit
					$submit.attr('disabled', !canSubmit)
				}
				if (delay) {
					done_t = setTimeout(done, delay)
				} else {
					if (done_t) clearTimeout(done_t)
					done()
				}
			}

			if (!path) {
				responseHandler(0)
				return
			}

			$.ajax({
				url:	url,
				type: 	'GET',
				dataType: 'json',
				success: function(res) {return responseHandler(200, res)},
				error:	function(err) {return responseHandler(err.status, err.responseJSON)},
			})

		}

		// handle keyboard input and schedule a check for entered graph name
		var oldPath = null
		$pathInput
			.on('keydown', function(e) {
				if (e.keyCode === 13) {	// enter
					if (canSubmit)
						return true

					// else check in progress
					e.preventDefault()
					return false
				}
			})
			.on('keyup blur', function(e) {
				val = this.value.trim()
				if (val && (val === oldPath))
					return true

				oldPath = val
				canSubmit = false
				$submit.attr('disabled', true)

				if (t)
					clearTimeout(t)
				t = setTimeout(function(){checkGraphExists(val)}, 300)
				return true
			})
			.trigger('keyup')

		$form.on('submit', function(){
			$submitLabel.text('Publishing')
			return true
		})

	}

	if (!VizorUI.userIsLoggedIn()) {
		VizorUI.openLoginModal(dfd)
			.then(openSaveGraph)
	} else {
		openSaveGraph(dfd)
	}

	return dfd.promise
}


VizorUI.prototype.viewSource = function() {
	var b = bootbox.dialog({
		message: '<h3 style="margin-top:0;padding-top:0;">source</h3><textarea spellcheck="false" style="resize:none" autocorrect="false" readonly="true" class="form-control scrollbar" cols="80" rows="40">'+
			E2.core.serialise()+'</textarea>',
		buttons: { 'OK': function() {} }
	});
	jQuery(b).addClass('wideauto').addClass('viewsource');
};

VizorUI.prototype.showStartDialog = function() {
	var dfd = when.defer()
	var selectedTemplateUrl = null

	// keep track of how many times the dialog has been seen
	// do not show dialog if user logged in and shown more than twice
	// do not show if user not logged in and shown more than five times
	// cookie keeps for 24h from visit
	var cookieName = 'vizor100'
	var c = Cookies.get(cookieName), times = 0

	try { c = JSON.parse(c) }
	catch (e) { c = {} }

	if (c && ('seen' in c)) {
		times = parseInt(c.seen)
		c.seen = (isNaN(times)) ?  0  : times++
	} else {
		times = 1
		c = { seen: times }
	}

	var doNotShowDialog =
		(VizorUI.userIsLoggedIn() &&  times > 2) ||
			(!VizorUI.userIsLoggedIn() &&  times > 5)

	var d = new Date()
	d.setTime(d.getTime() + (86400*1000))	// tomorrow
	Cookies.set(cookieName, {seen: times}, {expires: d})

	if (c && doNotShowDialog) {
		dfd.resolve(selectedTemplateUrl)
		return dfd.promise;
	}

	var welcomeModal = VizorUI.modalOpen(
		E2.views.patch_editor.intro({user:E2.models.user.toJSON()}),
		null,
		'nopad welcome editorIntro'
	)

	welcomeModal.on('hidden.bs.modal', function(){
		VizorUI.checkCompatibleBrowser()
		dfd.resolve(selectedTemplateUrl)
	})

	var $slides = jQuery('.minislides', welcomeModal)
	var ms = new Minislides($slides);

	jQuery('a.modal-close', $slides).on('click', function(e){
		e.preventDefault();
		e.stopPropagation();
		VizorUI.modalClose(welcomeModal);
		return false;
	});

	jQuery('a.view-create360', $slides).on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		VizorUI.modalClose(welcomeModal);
		selectedTemplateUrl = '/data/graphs/create-360.json'
		return false;
	});

	jQuery('a.view-example', $slides).on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		VizorUI.modalClose(welcomeModal);
		selectedTemplateUrl = '/data/graphs/example.json'
		return false;
	});

	jQuery('a.sign-in', $slides).on('click', function(e){
		e.preventDefault();
		e.stopPropagation();
		E2.controllers.account.openLoginModal()
		return false;
	});

	jQuery('a.sign-up', $slides).on('click', function(e){
		e.preventDefault();
		e.stopPropagation();
		E2.controllers.account.openSignupModal()
		return false;
	});

	return dfd.promise;
}

VizorUI.prototype.updateProgressBar = function(percent) {
	var dom = this.dom;
	percent = 0.0 + percent;
	if (percent > 100) percent = 100;
	if (percent < 0) percent = 0;
	dom.progressBar = $('#progressbar');
	
	if (!dom.progressBar.is(':visible'))
		dom.progressBar.show().width(1);
	
	var winWidth = $(window).width();
	var barWidth = dom.progressBar.width();
	var newWidth = winWidth / 100 * percent;
	var barSpace = winWidth - barWidth;
	var barSpeed = 1000 - percent * 8;
	
	percent = (percent === 0) ? (barWidth / newWidth + 5) : (percent);
	newWidth = (newWidth <= barWidth) ? (barSpace / 100 * percent + barWidth) : (newWidth);
	
	dom.progressBar.stop().animate({width: newWidth}, {duration: barSpeed, easing: 'linear', complete: function() {
		if ($(this).width() === winWidth)
			$(this).fadeOut('slow');
	}});
}


/***** HELPER METHODS *****/

VizorUI.prototype.getCurrentGraphSize = function() {
	var state = E2.app.graphStore.getGraphSize()
	return state.size
}

VizorUI.openEditorHelp = function() {
	var keyData = _.extend({}, uiKeys);
	var modShift = uiKeys.modShift,
	 	modMeta = uiKeys.modMeta,
	 	modAlt = uiKeys.modAlt;

	var htmlFromKey = function(charOrKeycode) {
		var isOSX = /mac os x/.test(navigator.userAgent.toLowerCase());
		var html = []
		var add = function(key, className) {
			var tag
			if (typeof className !== 'undefined')
				tag = '<kbd class="' + className + '">'
			else
				tag = '<kbd>';
			var end = '</kbd>'
			html.push(tag + key.toLowerCase() + end)
		}
		var key_meta = (isOSX) ? 'cmd' : 'ctrl';

		if (Object.prototype.toString.call(charOrKeycode) === '[object String]' ) { // isString()
			add(charOrKeycode)
		} else {

			if (charOrKeycode >= modAlt) {
				add('alt', 'modifier key_alt');
				charOrKeycode -= modAlt;
			}
			if (charOrKeycode >= modMeta) {
				add(key_meta, (isOSX) ? 'modifier key_cmd' : 'modifier key_ctrl');
				charOrKeycode -= modMeta;
			}
			if (charOrKeycode >= modShift) {
				add('shift', 'modifier key_shift');
				charOrKeycode -= modShift;
			}

			switch (charOrKeycode) {
				case 9:
					add('tab', 'wide');
					break;
				case 13:
					add('enter');
					break;
				case 27:
					add('esc', 'wide');
					break;
				case 32:
					add('space');
					break;
				case 0:		// modifier keys only
					break;
				default:
					add(String.fromCharCode(charOrKeycode));
			}
		}
		return html.join(" + ");
	};
	for (var z in keyData) {
		if (keyData.hasOwnProperty(z))
			keyData[z] = htmlFromKey(keyData[z]);
	}
	var viewData = {
		keys: keyData
	}
	var html = E2.views.patch_editor.help_shortcuts(viewData);
	return VizorUI.modalOpen(html, 'Keyboard Shortcuts', 'mHelp mShortcuts')

}

VizorUI.checkCompatibleBrowser = function() {
	var agent = navigator.userAgent;
	var heading=false, message=false;

	var isMobile = VizorUI.isMobile.any();

	if ((/Safari/i.test(agent)) || (/Chrome/i.test(agent)) || (/Firefox/i.test(agent))) {

	}
	else if (isMobile) {
		heading = 'Mobile support';
		message = '<h4>Please view this page on your desktop/laptop. '+
					 'The editor is not ready for mobile just yet.</h4>';
	}
	else {
		heading = 'Browser support';
		message = '<h4>We want you to fully enjoy Vizor. <br />The editor works best in '+
					 '<a href="http://www.google.com/chrome/" target="_blank"'+
					 ' alt="Get Chrome">Chrome</a> or '+
					 '<a href="http://www.mozilla.org/firefox/new/" target="_blank"'+
					 ' alt="Get Firefox">Firefox</a>.</h4>';

	}
	if (message) VizorUI.modalOpen(message, heading, 'note', true, {buttons: { Ok: function() {}}});
}
