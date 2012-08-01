/*!
 * jscss.js
 *
 * Copyright 2012, usp
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
var jscss = (function(){
	var ua = navigator.userAgent,
		vendorPrefix = false,
		oldIE = false,
		
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
		var style = document.createElement( 'style' ),
			result = tree2str( root , false , useFlag );

		style.type = type || 'text/css';

		if ( !oldIE ) {
			style.innerHTML = result;
		}
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );
		if ( oldIE ) {
			style.styleSheet.cssText = result;
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
					i ,
					selectors;

				while ( c ) {
					if ( c.parent ) {
						selectors = selectorMix( c.selectors , selectors );
						c = c.parent;
					}
					else {
						throw 'extend faild';
					}

					for ( i = 0; i < c.children.length; i++ ) {
						if ( c.children[ i ].name == m ) {
							c.children[ i ].selectors = c.children[ i ].selectors.concat( selectors );
							return '';
						}
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
		if( tree.children ) {
			for ( ; i < tree.children.length; i++ ) {
				str += tree2str( tree.children[ i ] , tree , useFlag );
			}
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
		if ( tree.children ) {
			for ( var i = 0; i < tree.children.length; i++ ) {
				minimize( tree.children[ i ] );
			}
		}
	}
})();
