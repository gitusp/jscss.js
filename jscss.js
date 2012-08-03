/*!
 * jscss.js
 *
 * Copyright 2012, usp
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * the library requires "client.js"
 * https://github.com/uspDev/client.js
 */
var jscss = (function(){
	var ua = typeof navigator != 'undefined' ? navigator.userAgent : '',
		vendorPrefix = typeof client != 'undefined' ? client.getVendorPrefix() : false,
		needCssText = typeof client != 'undefined' ? client.needCssText() : false,
		
		// regexp
		regVendorPrefixProp = /-\*-([^:;]*?)\s*:\s*([^:;]*?)\s*;/g,
		regVendorPrefixVal = /([^:;]*?)\s*:\s*-\*-([^:;]*?)\s*;/g,
		regEnhance = /\+\+(.*?;)/g,
		regSpaces = /\s+/mg,
		regSpaceHead = /^\s/,
		regSpaceTail = /\s$/,
		regSpaceCommas = /\s?,\s?/g,
		regCommaTail = /,$/,
		regExtend = /@(\S*?);/g,
		regExtendDef = /@(\S*)/,
		regScope = /~(\S*?);/g,
		regScopeDef = /~(\S*)/;

	return jscss;
	
	function jscss ( str , compile , dry ) {
		var root ,
			useFlag = compile ,
			compiled = false;

		// from object code ( fast )
		if ( str instanceof Object ) {
			useFlag = true;
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

		// use jscss as compiler and it return "Object code"
		if ( compile ) {
			minimize( root );
			compiled = JSON.stringify( root );
		}

		// tree to str
		var result = tree2str( root , false , useFlag );

		// append to head
		if ( !dry ) {
			var style = document.createElement( 'style' );
			style.type = 'text/css';

			if ( !needCssText ) {
				style.innerHTML = result;
			}
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );
			if ( needCssText ) {
				style.styleSheet.cssText = result;
			}
		}

		return compiled;
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
			if ( selector.search( regExtendDef ) != -1 ) {
				rule.name = RegExp.$1;
				rule.selectors = [];
			}
			else if ( selector.search( regScopeDef ) != -1 ) {
				rule.selectors = [ '&' ];
				parent = hash[ RegExp.$1 ];
				if ( !parent ) {
					throw 'no parent';
				}
			}
			else {
				selector = selector.replace( regSpaces , ' ' );
				selector = selector.replace( regSpaceHead , '' );
				selector = selector.replace( regSpaceTail , '' );
				selector = selector.replace( regSpaceCommas , ',' );
				selector = selector.replace( regCommaTail , '' );
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
			definition = definition.replace( regSpaces , ' ' );
			definition = definition.replace( regSpaceHead , '' );
			definition = definition.replace( regSpaceTail , '' );

			// extend
			definition = definition.replace( regExtend , function ( a , m ) {
				var c = parent ,
					selectors = rule.selectors ,
					i ;

				while ( c ) {
					for ( i = 0; i < c.children.length; i++ ) {
						if ( c.children[ i ] == rule ) {
							continue;
						}
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
			definition = definition.replace( regScope , function ( a , m ) {
				hash[ m ] = rule;
				return '';
			} );

			rule.definition = definition;
			rule.parent = parent;
			rule.children = [];

			// inner block
			if ( inner ) {
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

	function tree2str ( tree , parent , useFlag ) {
		// mixin selectors
		if ( parent ) {
			tree.selectors = selectorMix( parent.selectors , tree.selectors );
		}

		// print
		var i = 0 , str = '' , definition = tree.definition;
		if ( tree.selectors.length && definition ) {
			// vendor prefix
			if ( !useFlag || tree.vendorPrefixProp ) {
				definition = definition.replace( regVendorPrefixProp , function ( a , prop , val ) {
					if ( vendorPrefix ) {
						return prop + ':' + val + ';' + vendorPrefix + prop + ':' + val + ';';
					}
					return '';
				} );
			}
			if ( !useFlag || tree.vendorPrefixVal ) {
				definition = definition.replace( regVendorPrefixVal , function ( a , prop , val ) {
					if ( vendorPrefix ) {
						return prop + ':' + val + ';' + prop + ':' + vendorPrefix + val + ';';
					}
					return '';
				} );
			}

			// enhance
			if ( !useFlag ||  tree.enhance ) {
				definition = definition.replace( regEnhance , function ( a , m ) {
					if ( vendorPrefix ) {
						return m;
					}
					return '';
				} );
			}

			str += tree.selectors.join( ',' ) + '{' + definition + '}\n';
		}

		// child
		for ( ; i < tree.children.length; i++ ) {
			str += tree2str( tree.children[ i ] , tree , useFlag );
		}

		// result
		return str;
	}

	function minimize ( tree ) {
		delete tree.name;
		delete tree.parent;

		if ( regVendorPrefixProp.test( tree.definition ) ) {
			tree.vendorPrefixProp = true;
		}
		if ( regVendorPrefixVal.test( tree.definition ) ) {
			tree.vendorPrefixVal = true;
		}
		if ( regEnhance.test( tree.definition ) ) {
			tree.enhance = true;
		}

		// continue
		for ( var i = 0; i < tree.children.length; i++ ) {
			minimize( tree.children[ i ] );
		}
	}
})();

// for nodeJS
if ( typeof exports != 'undefined' ) {
	exports.compile = function ( str ) {
		return jscss( str , true , true );
	};
}
