/*!
 * jscss.js
 *
 * Copyright 2012, usp
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
var jscss = (function(){
	var ua = navigator.userAgent,
		vendorPrefix = false,
		oldIE = false;

	if ( /Firefox\/(\d+)/.test( ua ) ) { 
		if ( RegExp.$1 >= 4 ) { 
			vendorPrefix = '-moz-';
		}   
	}   
	else if ( ua.indexOf( 'AppleWebKit' ) != -1 ) { 
		vendorPrefix = '-webkit-';
	}   
	else if ( /MSIE (7|8)/.test( ua ) ) { 
		oldIE = true;
	}
	else if ( ua.indexOf( 'MSIE 9' ) != -1 ) { 
		vendorPrefix = '-ms-';
	}

	return jscss;
	
	function jscss ( str , compile , type ) {
		var root;

		// from object code ( fast )
		if ( str instanceof Object ) {
			root = str;
		}
		// from string ( normal )
		else {
			root = {
				selectors : [ '' ] ,
				children : [] 
			};

			// remove comment
			str = str.replace( /\/\*[\s\S]*?\*\//mg , '' );
			str = str.replace( /\/\/.*/g , '' );
			
			// treeize
			process( str , root , {} );
		}

		// tree to str
		var style = document.createElement( 'style' ),
			result = tree2str( root );

		style.type = type || 'text/css';

		if ( !oldIE ) {
			style.innerHTML = result;
		}
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );
		if ( oldIE ) {
			style.styleSheet.cssText = result;
		}

		// use jscss as compiler and it return "Object code"
		if ( compile ) {
			killParent( root );
			return JSON.stringify( root );
		}
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
			}
			else if ( selector.search( /~(\S*)/ ) != -1 ) {
				rule.selectors = [ '&' ];
				parent = hash[ RegExp.$1 ];
				if ( !parent ) {
					throw 'no parent';
				}
			}
			else {
				selector = selector.replace( /\s+/mg , ' ' );
				selector = selector.replace( /^\s/ , '' );
				selector = selector.replace( /\s$/ , '' );
				selector = selector.replace( /\s?,\s?/g , ',' );
				selector = selector.replace( /,$/ , '' );
				rule.selectors = selector.split( ',' );
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

			rule.definition = definition;
			rule.parent = parent;

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

	function tree2str ( tree , parent ) {
		// mixin selectors
		if ( parent ) {
			tree.selectors = selectorMix( parent.selectors , tree.selectors );
		}

		// print
		var i = 0 , str = '';
		if ( tree.selectors.length && tree.definition ) {
			// vendor prefix
			tree.definition = tree.definition.replace( /-\*-([^:;]*?)\s*:\s*([^:;]*?)\s*;/g , function ( a , prop , val ) {
				if ( vendorPrefix ) {
					return prop + ':' + val + ';' + vendorPrefix + prop + ':' + val + ';';
				}
				return '';
			} );
			tree.definition = tree.definition.replace( /([^:;]*?)\s*:\s*-\*-([^:;]*?)\s*;/g , function ( a , prop , val ) {
				if ( vendorPrefix ) {
					return prop + ':' + val + ';' + prop + ':' + vendorPrefix + val + ';';
				}
				return '';
			} );

			// enhance
			tree.definition = tree.definition.replace( /\+\+(.*?;)/g , function ( a , m ) {
				if ( vendorPrefix ) {
					return m;
				}
				return '';
			} );

			str += tree.selectors.join( ',' ) + '{' + tree.definition + '}\n';
		}

		// child
		if( tree.children ) {
			for ( ; i < tree.children.length; i++ ) {
				str += tree2str( tree.children[ i ] , tree );
			}
		}

		// result
		return str;
	}

	function killParent ( tree ) {
		delete tree.parent;
		if ( tree.children ) {
			for ( var i = 0; i < tree.children.length; i++ ) {
				killParent( tree.children[ i ] );
			}
		}
	}
})();
