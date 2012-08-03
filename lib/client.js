/*
 *	get client info
 */
var client = (function(){
	var ua = navigator.userAgent,
		iphone = false,
		android = false,
		ie6 = false,
		ie7 = false,
		ie8 = false,
		ie9 = false,
		webkit = false,
		modernFirefox = false;

	// device detect
	if ( ua.match( 'iPhone' ) ) {
		iphone = true;
	}
	else if ( ua.match( 'Android' ) ) {
		android = true;
	}

	// browse detect
	if ( ua.match( 'MSIE 6' ) ) {
		ie6 = true;
	}
	else if ( ua.match( 'MSIE 7' ) ) {
		ie7 = true;
	}
	else if ( ua.match( 'MSIE 8' ) ) {
		ie8 = true;
	}
	else if ( ua.match( 'MSIE 9' ) ) {
		ie9 = true;
	}
	else if ( /Firefox\/(\d+)/.test( ua ) ) { 
		if ( RegExp.$1 >= 4 ) { 
			modernFirefox = true;
		}   
	}   
	else if ( ua.indexOf( 'AppleWebKit' ) != -1 ) { 
		webkit = true;
	}   

	// pseudo class method
	return {
		isSmartPhone : function(){
			return iphone || android;
		},
		isAndroid : function(){
			return android;
		},
		isIPhone : function(){
			return iphone;
		},
		getAvailableWidth : function(){
			if ( iphone ) {
				// landscape
				if ( Math.abs( window.orientation ) === 90 ) {
					return screen.height;
				}
				// portrait
				else {
					return screen.width;
				}
			}
			if ( android ) {
				return window.outerWidth;
			}
			return window.innerWidth;
		},
		getAvailableHeight : function(){
			if ( iphone ) {
				// landscape
				if ( Math.abs( window.orientation ) === 90 ) {
					return screen.width - 20 /* device header */ - 32 /* device footer */;
				}
				// portrait
				else {
					return screen.height - 20 /* device header */ - 44 /* device footer */;
				}
			}
			if ( android ) {
				return window.outerHeight;
			}
			return window.innerHeight;
		},
		getVendorPrefix : function () {
			if ( webkit ) {
				return '-webkit-';
			}
			if ( ie9 ) {
				return '-ms-';
			}
			if ( modernFirefox ) {
				return '-moz-'
			}
			return false;
		},
		needCssText : function () {
			return ie6 || ie7 || ie8;
		},
		pngOpacityAvailable : function(){
			return !( ie6 || ie7 || ie8 );
		}
	};
})();
