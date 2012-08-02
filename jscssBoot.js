(function () {
	if ( typeof jscss == 'undefined' ) {
		throw 'no jscss';
	}

	var links = document.getElementsByTagName( 'link' ),
		i = 0,
		modules = '',
		http = new XMLHttpRequest;

	for ( ; i < links.length; i++ ) {
		// from string
		if ( links[ i ].type == 'text/jscss' ) {
			// sync load from "cache"
			http.open( 'GET' , links[ i ].href , false );
			http.send(null);
			modules += http.responseText;

			// cut from head
			links[ i ].parentNode.removeChild( links[ i ] );
		}

		// from obj
		if ( links[ i ].type == 'text/jsobj' ) {
			// sync load from "cache"
			http.open( 'GET' , links[ i ].href , false );
			http.send(null);
			jscss( JSON.parse( http.responseText ) );

			// cut from head
			links[ i ].parentNode.removeChild( links[ i ] );
		}
	}

	// from str
	if ( modules ) {
		jscss( modules );
	}
})();
