var msg = document.getElementById('adv_msg')
var msg_text = ['echo Hello, World!',
				" nmap -v -O -sC -sV Hack.it|grep 'ftp'",
                " ping -4 -c10 -I wlo1 -f 192.168.1.1"  ,
                " php -S 192.168.1.1:80",
                " sudo apt install tor theharvester"
                ]

var counter = 0
var msg_nom = 0
var isTyping = true
typing = setInterval(()=>{
	if(isTyping){
		if (counter < msg_text[msg_nom].length) {
			msg.innerHTML =msg.innerHTML+msg_text[msg_nom][counter]
			counter++
		}else{
			isTyping = false
		}
	}
},500)



deleting = setInterval(()=>{
	if (!isTyping) {
		if(msg.innerHTML != ''){
			msg.innerHTML = msg.innerHTML.substr(0,msg.innerHTML.length-1)
		}else{
			isTyping= true
			counter =0
			temp = msg_nom
			while(temp == msg_nom){
			msg_nom=Math.round(Math.random() * (msg_text.length-1))
			}
		}
	}
},100)
