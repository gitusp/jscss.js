var jscss = require( './jscss' );

process.stdin.resume();

process.stdin.on('data', function ( chunk ) {
	var result = jscss.compile( chunk );
	process.stdout.write( result );
});
