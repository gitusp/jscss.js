<!DOCTYPE html>
<html>
<head></head>
<body>

<script src="lib/client.js"></script>
<script src="jscss.js"></script>
<script type="text/javascript">

var tpl = <?php include( './compiled.obj' ); ?> ,
	d1 = new Date,
	result = jscss( tpl , false , true ),
	d2 = new Date;

document.write( ( d2 - d1 ) + 'msec' );


</script>
</body>
</html>
