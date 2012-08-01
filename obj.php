<!DOCTYPE html>
<html>
<head></head>
<body>

<script src="jscss.js"></script>
<script type="text/javascript">

var tpl = <?php inculde( 'test.obj' ); ?> ,
	d1 = new Date,
	result = jscss( tpl , true , 'test/css' ),
	d2 = new Date;

document.write( ( d2 - d1 ) + 'msec' );

</script>
</html>
