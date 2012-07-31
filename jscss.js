var jscss = (function(){

	return jscss;
	
	function jscss ( str ) {
		// remove comment
		str = str.replace( /\/\*[\s\S]*?\*\//mg , '' );
		str = str.replace( /\/\/.*/g , '' );

		// treeize
		var root = {
				selectors : [ '' ] ,
				children : [] 
			};
		process( str , root , {} );

		// tree to str
		var style = document.createElement( 'style' );
		style.type = 'text/css';
		style.innerHTML = tree2str( root );
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );
	}

	function tree2str ( tree ) {
		// mixin selectors
		if ( tree.parent ) {
			tree.selectors = selectorMix( tree.parent.selectors , tree.selectors );
		}

		// print
		var i = 0 , str = '';
		if ( tree.selectors.length && tree.definition ) {
			str += tree.selectors.join( ',' ) + '{' + tree.definition + '}\n';
		}

		// child
		if( tree.children ) {
			for ( ; i < tree.children.length; i++ ) {
				str += tree2str( tree.children[ i ] );
			}
		}

		// result
		return str;
	}

	function process ( str , parent , hash ) {
		// check out target block
		var selector ,
			block ,
			definition ,
			inner ,
			rest ,
			start ,
			begin ,
			end ,
			rule;

		start = str.indexOf( '{' );

		// any block
		if ( start != -1 ) {
			// set
			selector = str.substr( 0 , start );
			rule = {};

			// lookup
			stack = 1;
			begin = start + 1;
			while ( stack ) {
				end = str.indexOf( '}' , begin );
				begin = str.indexOf( '{' , begin );

				if ( end == -1 ) {
					throw 'compile error';
				}
				if ( begin == -1 || end < begin ) {
					stack--;
					begin = end + 1;
				}
				else {
					stack++;
					begin++;
				}
			}

			// save str
			block = str.substr( start + 1 , end - start - 1 );
			rest = str.substr( end + 1 );

			// process selector
			if ( selector.search( /@(\S*)/ ) != -1 ) {
				rule.name = RegExp.$1;
				rule.selectors = [];
				rule.parent = parent;
			}
			else if ( selector.search( /~(\S*)/ ) != -1 ) {
				rule.selectors = [ '&' ];
				rule.parent = hash[ RegExp.$1 ];
			}
			else {
				selector = selector.replace( /\s+/mg , ' ' );
				selector = selector.replace( /^\s/ , '' );
				selector = selector.replace( /\s$/ , '' );
				selector = selector.replace( /\s?,\s?/g , ',' );
				selector = selector.replace( /,$/ , '' );
				rule.selectors = selector.split( ',' );
				rule.parent = parent;
			}

			// process block
			begin = block.indexOf( '{' );
			if ( begin != -1 ) {
				definition = block.substr( 0 , begin );
				begin = definition.lastIndexOf( ';' ) + 1;
				definition = definition.substr( 0 , begin );
				inner = block.substr( begin );
			}
			else {
				definition = block;
			}

			// clean up
			definition = definition.replace( /\s+/mg , ' ' );
			definition = definition.replace( /^\s/ , '' );
			definition = definition.replace( /\s$/ , '' );

			// extend
			definition = definition.replace( /@(\S*?);/g , function ( a , m ) {
				var c = parent ,
					i ,
					selectors = rule.selectors;

				while ( c ) {
					for ( i = 0; i < c.children.length; i++ ) {
						if ( c.children[ i ].name == m ) {
							c.children[ i ].selectors = c.children[ i ].selectors.concat( selectors );
							return '';
						}
					}

					if ( c.parent ) {
						selectors = selectorMix( c.selectors , selectors );
						c = c.parent;
					}
					else {
						throw 'extend faild';
					}
				}
			} );

			// register
			definition = definition.replace( /~(\S*?);/g , function ( a , m ) {
				hash[ m ] = rule;
				return '';
			} );

			// vendor prefix
			definition = definition.replace( /-\*-([^:;]*?)\s*:\s*([^:;]*?)\s*;/g , function ( a , prop , val ) {
				return prop + ':' + val + ';' + '-webkit-'  + prop + ':' + val + ';';
			} );
			definition = definition.replace( /([^:;]*?)\s*:\s*-\*-([^:;]*?)\s*;/g , function ( a , prop , val ) {
				return prop + ':' + val + ';' + prop + ':' + '-webkit-'  + val + ';';
			} );

			// enhance
			definition = definition.replace( /\+\+(.*?;)/g , function ( a , m ) {
				if ( true ) {
					return m;
				}
				return '';
			} );

			rule.definition = definition;

			// inner block
			if ( inner ) {
				rule.children = [];
				process( inner , rule , hash );
			}

			// continue...
			parent.children.push( rule );
			process( rest , parent , hash );
		}
	}

	function selectorMix ( s1 , s2 ) {
		var r = [] , i , j;
		for ( i = 0; i < s1.length; i++ ) {
			for ( j = 0; j < s2.length; j++ ) {
				r.push( s1[ i ] + ( s2[ j ].substr( 0 , 1 ) == '&' ? s2[ j ].substr( 1 ) : ' ' + s2[ j ] ) );
			}
		}
		return r;
	}
})();
