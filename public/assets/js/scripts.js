'use strict';

window.helpers = (function() {

	init();

	/**
	 * Initialize public window.helpers functions
	 */
	function init() {
		fixBrowsers();
	}

	/**
	 * Fix browser weirdness
	 * Correct Modernizr bugs
	 */
	function fixBrowsers() {
		var ua = navigator.userAgent.toLowerCase(),
			chrome = ua.lastIndexOf('chrome/') > 0,
			$html = $('html');
		
		// Modernizr 2 bug: Chrome on Windows 8 gives a false negative for transforms3d support
		// Google does not plan to fix this; https://code.google.com/p/chromium/issues/detail?id=129004
		if (chrome) {
			var chromeversion = ua.substr(ua.lastIndexOf('chrome/') + 7, 2);
			if (chromeversion >= 12 && $html.hasClass('no-csstransforms3d')) {
				$html
					.removeClass('no-csstransforms3d')
					.addClass('csstransforms3d');
			}
		}
	}
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2NyaXB0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbndpbmRvdy5oZWxwZXJzID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdC8qKlxyXG5cdCAqIEluaXRpYWxpemUgcHVibGljIHdpbmRvdy5oZWxwZXJzIGZ1bmN0aW9uc1xyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRmaXhCcm93c2VycygpO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogRml4IGJyb3dzZXIgd2VpcmRuZXNzXHJcblx0ICogQ29ycmVjdCBNb2Rlcm5penIgYnVnc1xyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIGZpeEJyb3dzZXJzKCkge1xyXG5cdFx0dmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLFxyXG5cdFx0XHRjaHJvbWUgPSB1YS5sYXN0SW5kZXhPZignY2hyb21lLycpID4gMCxcclxuXHRcdFx0JGh0bWwgPSAkKCdodG1sJyk7XHJcblx0XHRcclxuXHRcdC8vIE1vZGVybml6ciAyIGJ1ZzogQ2hyb21lIG9uIFdpbmRvd3MgOCBnaXZlcyBhIGZhbHNlIG5lZ2F0aXZlIGZvciB0cmFuc2Zvcm1zM2Qgc3VwcG9ydFxyXG5cdFx0Ly8gR29vZ2xlIGRvZXMgbm90IHBsYW4gdG8gZml4IHRoaXM7IGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0xMjkwMDRcclxuXHRcdGlmIChjaHJvbWUpIHtcclxuXHRcdFx0dmFyIGNocm9tZXZlcnNpb24gPSB1YS5zdWJzdHIodWEubGFzdEluZGV4T2YoJ2Nocm9tZS8nKSArIDcsIDIpO1xyXG5cdFx0XHRpZiAoY2hyb21ldmVyc2lvbiA+PSAxMiAmJiAkaHRtbC5oYXNDbGFzcygnbm8tY3NzdHJhbnNmb3JtczNkJykpIHtcclxuXHRcdFx0XHQkaHRtbFxyXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCduby1jc3N0cmFuc2Zvcm1zM2QnKVxyXG5cdFx0XHRcdFx0LmFkZENsYXNzKCdjc3N0cmFuc2Zvcm1zM2QnKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=