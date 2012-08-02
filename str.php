<!DOCTYPE html>
<html>
<head></head>
<body>

<script type="text/x-css" name="testcss" id="testcss">
<?php include( './manyrules.jscss' ); ?>
</script>
<script src="jscss.js"></script>
<script type="text/javascript">

var tpl = document.getElementById( 'testcss' ).innerHTML,
	d1 = new Date,
	result = jscss( tpl , false , true ),
	d2 = new Date;

document.write( ( d2 - d1 ) + 'msec' );

</script>
</body>
</html>
