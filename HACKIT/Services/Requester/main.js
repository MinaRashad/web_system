'use strict'

let urlDOM = document.getElementById('url')
let methodDOM = document.getElementById('method')
let dataDOM = document.getElementById('data')
let terminal = document.getElementById('terminal')


function start(){
	terminal.innerHTML=''
	let data = format(dataDOM.value)
	let method = methodDOM.value?methodDOM.value:"get"
	let url = urlDOM.value
	terminal.innerHTML += `Sending a ${method.toUpperCase()} request \
							to ${url}....<br>`
	sendData(method,url,data)
}

function format(dataStr){
	let dataCoubles=dataStr.split('\n')
	let data = {}
	for (var i = 0; i < dataCoubles.length; i++) {
		let couble=dataCoubles[i].split('=')
		if (couble[1]) {
		data[couble[0]]=couble[1]
		}
	}
	return data
}

function sendData(method,url,data){
    var xhr = new XMLHttpRequest();
    if (method.toLowerCase() == 'get') {
        let keys = [...Object.keys(data)]
        let values = [...Object.values(data)]
        let getRequest = '?'
        for(let i in keys){
            i=parseInt(i)
            getRequest += `${keys[i]}=${values}&`

        }
        url = url + getRequest
    }
    console.log(method,url)
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function(e) { // Call a function when the state changes.
		if (xhr.readyState == 4 && xhr.status == 200) {
			terminal.innerHTML+='Finished!<br>##########<br><br>'
			terminal.innerHTML+=xhr.responseText
		}
	    else if(xhr.status!=200) {
	    	terminal.innerHTML+="Request using AJAX failed.<br>"
	    	if (method.toLowerCase() == 'get') {
	    		terminal.innerHTML+="Trying Iframing...<br>"
	    		grapTheWebsite(url)
	    	}
	    }

    }
    if (method.toLowerCase() == 'get'){xhr.send();}
    else {xhr.send(JSON.stringify(data))}

}

function grapTheWebsite(url){
	let iframe = document.createElement('iframe')
	iframe.src = url
	iframe.style="font-size: 10vh; display: block;width:50vw;height:50vh;color: red;position: fixed;right: 0vh;bottom: 0vh;"
	terminal.appendChild(iframe)

	terminal.innerHTML += "<br><p style='display:block;'> Finished<br>##########<br></p><br>"
	//iframe.contentDocument.location.reload()
	console.log(iframe.contentDocument.body.innerHTML)
	if (iframe.contentDocument.body.innerHTML) {terminal.innerHTML += iframe.contentDocument.body.innerHTML}
	else{iframe.style.display = 'none'}
}
