var jscss = require( './jscss' ),
	fs = require('fs'),
    str = fs.readFileSync('/dev/stdin').toString();

str = jscss.compile( str );
process.stdout.write( str );
