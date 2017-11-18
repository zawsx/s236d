/* main.js http://www.codrops.com * Licensed under the MIT license.* http://www.opensource.org/licenses/mit-license.php */
;(function(window) {'use strict';	// helper functions	// from https://davidwalsh.name/vendor-prefix
var prefix = (function () {var styles = window.getComputedStyle(document.documentElement, ''),
	pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1],
			dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
return {dom: dom,	lowercase: pre,	css: '-' + pre + '-',	js: pre[0].toUpperCase() + pre.substr(1)};	})();
// vars & stuff
var support = {transitions : Modernizr.csstransitions},
	transEndEventNames = {'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend'},
	transEndEventName = transEndEventNames[Modernizr.prefixed('transition')],
	onEndTransition = function(el, callback, propTest) {
		var onEndCallbackFn = function( ev ) {
			if (support.transitions ) {
					if (ev.target != this || propTest && ev.propertyName !== propTest && ev.propertyName !== prefix.css + propTest ) return;this.removeEventListener( transEndEventName, onEndCallbackFn );	}
			if (callback && typeof callback === 'function' ) {callback.call(this);}	};
		if (support.transitions ) {el.addEventListener( transEndEventName, onEndCallbackFn );}	else {onEndCallbackFn();}
	},
	mall = document.querySelector('.mall'), // the mall element
	mallLevelsEl = mall.querySelector('.levels'), // mall´s levels wrapper
	mallLevels = [].slice.call(mallLevelsEl.querySelectorAll('.level')), // mall´s levels
	mallLevelsTotal = mallLevels.length, // total levels
	mallSurroundings = [].slice.call(mall.querySelectorAll('.surroundings')), // surroundings elems
	selectedLevel, // selected level position
	mallNav = document.querySelector('.mallnav'), // navigation element wrapper
	allLevelsCtrl = mallNav.querySelector('.mallnav__button--all-levels'), // show all mall´s levels ctrl
	levelUpCtrl = mallNav.querySelector('.mallnav__button--up'), // levels navigation up/down ctrls
	levelDownCtrl = mallNav.querySelector('.mallnav__button--down'),
	pins = [].slice.call(mallLevelsEl.querySelectorAll('.pin')), // pins
	contentEl = document.querySelector('.content'), // content element
	contentCloseCtrl = contentEl.querySelector('button.content__button'), // content close ctrl
	isOpenContentArea, // check if a content item is opened
	isNavigating, // check if currently animating/navigating
	isExpanded, // check if all levels are shown or if one level is shown (expanded)
		spacesListEl = document.getElementById('spaces-list'),// spaces list element
		spacesEl = spacesListEl.querySelector('ul.list'),// spaces list ul
		spaces = [].slice.call(spacesEl.querySelectorAll('.list__item > a.list__link')),// all the spaces listed
		// reference to the current shows space (name set in the data-name attr of both the listed spaces and the pins on the map)
		spaceref,
		sortByNameCtrl = document.querySelector('#sort-by-name'), // sort by ctrls
		// listjs initiliazation (all mall´s spaces)
		spacesList = new List('spaces-list', { valueNames: ['list__link', { data: ['level'] }, { data: ['category'] } ]} ),
		// smaller screens:
		openSearchCtrl = document.querySelector('button.open-search'),// open search ctrl
		containerEl = document.querySelector('.container'),// main container
		closeSearchCtrl = spacesListEl.querySelector('button.close-search');// close search ctrl

function init() {initEvents();} /** Initialize/Bind events fn.	 */
function initEvents() {mallLevels.forEach(function(level, pos) {// click on a Mall´s level
	level.addEventListener('click', function() {showLevel(pos+1);}); }); // shows this level
	// click on the show mall´s levels ctrl
	allLevelsCtrl.addEventListener('click', function() {showAllLevels();}); // shows all levels
	// navigating through the levels
	levelUpCtrl.addEventListener('click', function() {navigate('Down'); });
	levelDownCtrl.addEventListener('click', function() {navigate('Up'); });

	// sort by name ctrl - add/remove category name (css pseudo element) from list and sorts the spaces by name 
	sortByNameCtrl.addEventListener('click', function() {
		if (this.checked ) {classie.remove(spacesEl, 'grouped-by-category');spacesList.sort('list__link');}
		else {classie.add(spacesEl, 'grouped-by-category');spacesList.sort('category');}	});
	// hovering a pin / clicking a pin
	pins.forEach(function(pin) {
		var contentItem = contentEl.querySelector('.content__item[data-space="' + pin.getAttribute('data-space') + '"]');
		pin.addEventListener('mouseenter', function() {if (!isOpenContentArea ) 
			{classie.add(contentItem, 'content__item--hover');}	});
		pin.addEventListener('mouseleave', function() 
			{if (!isOpenContentArea ) {classie.remove(contentItem, 'content__item--hover');}	});
		pin.addEventListener('click', function(ev) {ev.preventDefault();
			openContent(pin.getAttribute('data-space')); // open content for this pin
			classie.remove(contentItem, 'content__item--hover');});		});// remove hover class (showing the title)
		contentCloseCtrl.addEventListener('click', function() {closeContentArea();}); // closing the content area

		// clicking on a listed space: open level - shows space
		spaces.forEach(function(space) {var spaceItem = space.parentNode,
				level = spaceItem.getAttribute('data-level'),	spacerefval = spaceItem.getAttribute('data-space');
			space.addEventListener('click', function(ev) {ev.preventDefault();
										closeSearch(); // for smaller screens: close search bar
										showLevel(level); // open level
										openContent(spacerefval); }); });// open content for this space
		openSearchCtrl.addEventListener('click', function() {openSearch();});// smaller screens: open the search bar
		closeSearchCtrl.addEventListener('click', function() {closeSearch();});	} // smaller screens: close the search bar

	/** Opens a level. The current level moves to the center while the other ones move away. */
function showLevel(level) {if (isExpanded ) {return false;}
selectedLevel = level; // update selected level val
setNavigationState(); // control navigation controls state
classie.add(mallLevelsEl, 'levels--selected-' + selectedLevel);
var levelEl = mallLevels[selectedLevel - 1]; classie.add(levelEl, 'level--current'); // the level element
onEndTransition(levelEl, function() {classie.add(mallLevelsEl, 'levels--open');	showPins(); // show level pins
	isExpanded = true;}, 'transform');
hideSurroundings();// hide surroundings element
showMallNav();// show mall nav ctrls
showLevelSpaces();} // filter the spaces for this level

/* Shows all Mall´s levels */
function showAllLevels() {if (isNavigating || !isExpanded ) {return false;} isExpanded = false;
classie.remove(mallLevels[selectedLevel - 1], 'level--current');
classie.remove(mallLevelsEl, 'levels--selected-' + selectedLevel);classie.remove(mallLevelsEl, 'levels--open');
removePins();	// hide level pins
showSurroundings();	// shows surrounding element
hideMallNav();	// hide mall nav ctrls
spacesList.filter();// show back the complete list of spaces
if (isOpenContentArea ) {closeContentArea();}} // close content area if it is open

/* Shows all spaces for current level */
function showLevelSpaces() {spacesList.filter(function(item) {return item.values().level === selectedLevel.toString(); });	}
/* Shows the level´s pins */function showPins(levelEl) {var levelEl = levelEl || mallLevels[selectedLevel - 1];
		classie.add(levelEl.querySelector('.level__pins'), 'level__pins--active');}
/* Removes the level´s pins */function removePins(levelEl) {var levelEl = levelEl || mallLevels[selectedLevel - 1];
		classie.remove(levelEl.querySelector('.level__pins'), 'level__pins--active');}
/* Show the navigation ctrls */function showMallNav() {classie.remove(mallNav, 'mallnav--hidden');}
/* Hide the navigation ctrls */function hideMallNav() {classie.add(mallNav, 'mallnav--hidden');}
/* Show the surroundings level */function showSurroundings() {
		mallSurroundings.forEach(function(el) {classie.remove(el, 'surroundings--hidden');});}
/* Hide the surroundings level */function hideSurroundings() {mallSurroundings.forEach(function(el) {
			classie.add(el, 'surroundings--hidden');});	}
/* Navigate through the mall´s levels */function navigate(direction) {
if (isNavigating || !isExpanded || isOpenContentArea ) {return false;}
isNavigating = true;	var prevSelectedLevel = selectedLevel;
var currentLevel = mallLevels[prevSelectedLevel-1];	// current level
if (direction === 'Up' && prevSelectedLevel > 1 ) {--selectedLevel;	}
else if (direction === 'Down' && prevSelectedLevel < mallLevelsTotal ) {++selectedLevel;}
else {isNavigating = false;	return false;}
setNavigationState();// control navigation controls state (enabled/disabled)
classie.add(currentLevel, 'level--moveOut' + direction);// transition direction class
var nextLevel = mallLevels[selectedLevel-1]	// next level element
classie.add(nextLevel, 'level--current');// ..becomes the current one
onEndTransition(currentLevel, function() {// when the transition ends..
	classie.remove(currentLevel, 'level--moveOut' + direction);
	setTimeout(function() {classie.remove(currentLevel, 'level--current');}, 60);// solves rendering bug for the SVG opacity-fill property
	classie.remove(mallLevelsEl, 'levels--selected-' + prevSelectedLevel);
	classie.add(mallLevelsEl, 'levels--selected-' + selectedLevel);showPins();// show the current level´s pins
	isNavigating = false;});

showLevelSpaces();// filter the spaces for this level
removePins(currentLevel);} // hide the previous level´s pins
/* Control navigation ctrls state. Add disable class 2the respective ctrl when current level is either 1st or the last. */
function setNavigationState() {if (selectedLevel == 1 ) {classie.add(levelDownCtrl, 'boxbutton--disabled');}
	else {classie.remove(levelDownCtrl, 'boxbutton--disabled');}
if (selectedLevel == mallLevelsTotal ) {classie.add(levelUpCtrl, 'boxbutton--disabled');}
else {classie.remove(levelUpCtrl, 'boxbutton--disabled');}	}
/* Opens/Reveals a content item. */
function openContent(spacerefval) {	// if one already shown:
	if (isOpenContentArea ) {hideSpace();spaceref = spacerefval;showSpace();}
	else {spaceref = spacerefval;openContentArea();}
	var activeItem = spacesEl.querySelector('li.list__item--active');// remove class active (if any) from current list item
	if (activeItem ) {classie.remove(activeItem, 'list__item--active');}
	// list item gets class active
	classie.add(spacesEl.querySelector('li[data-space="' + spacerefval + '"]'), 'list__item--active');
	// remove class selected (if any) from current space
	var activeSpaceArea = mallLevels[selectedLevel - 1].querySelector('svg > .map__space--selected');
	if (activeSpaceArea ) {classie.remove(activeSpaceArea, 'map__space--selected');}
	// svg area gets selected
	classie.add(mallLevels[selectedLevel - 1].querySelector('svg > .map__space[data-space="' + spaceref + '"]'), 'map__space--selected');}
/* Opens the content area. */
function openContentArea() {isOpenContentArea = true;showSpace(true);// shows space
classie.remove(contentCloseCtrl, 'content__button--hidden');// show close ctrl
classie.add(mall, 'mall--content-open');// resize mall area
classie.add(levelDownCtrl, 'boxbutton--disabled');// disable mall nav ctrls
classie.add(levelUpCtrl, 'boxbutton--disabled');}
/*Shows a space. */function showSpace(sliding) {
	var contentItem = contentEl.querySelector('.content__item[data-space="' + spaceref + '"]');// the content item
	classie.add(contentItem, 'content__item--current');// show content
	if (sliding ) {onEndTransition(contentItem, function() {classie.add(contentEl, 'content--open');});	}
		classie.add(mallLevelsEl.querySelector('.pin[data-space="' + spaceref + '"]'), 'pin--active');} // map pin gets selected
/* Closes the content area. */function closeContentArea() {classie.remove(contentEl, 'content--open');
	hideSpace();// close current space
	classie.add(contentCloseCtrl, 'content__button--hidden');// hide close ctrl
	classie.remove(mall, 'mall--content-open');// resize mall area
	if (isExpanded ) {setNavigationState();} // enable mall nav ctrls
isOpenContentArea = false;}
/* Hides a space. */function hideSpace() {
	var contentItem = contentEl.querySelector('.content__item[data-space="' + spaceref + '"]');// the content item
	classie.remove(contentItem, 'content__item--current');// hide content
	classie.remove(mallLevelsEl.querySelector('.pin[data-space="' + spaceref + '"]'), 'pin--active');// map pin gets unselected
	var activeItem = spacesEl.querySelector('li.list__item--active');// remove class active (if any) from current list item
	if (activeItem ) {classie.remove(activeItem, 'list__item--active');}
	// remove class selected (if any) from current space
	var activeSpaceArea = mallLevels[selectedLevel - 1].querySelector('svg > .map__space--selected');
	if (activeSpaceArea ) {classie.remove(activeSpaceArea, 'map__space--selected');}}
/* for smaller screens: open search bar */function openSearch() {
	showAllLevels();// shows all levels - we want to show all the spaces for smaller screens 
	classie.add(spacesListEl, 'spaces-list--open');	classie.add(containerEl, 'container--overflow');}
/* for smaller screens: close search bar */function closeSearch() {
		classie.remove(spacesListEl, 'spaces-list--open');	classie.remove(containerEl, 'container--overflow');}
init();  })(window);