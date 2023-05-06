document.addEventListener("keydown", function(e) {
	if (e.altKey && e.metaKey && e.code === "KeyX") {
		chatWrapper.style.display == "block" ? chatWrapper.style.display = "none" : chatWrapper.style.display = "block";
	}
})

let GBL_selectedCounter = 0;
let GBL_aiActivated = false;
let GBL_micActivated = false;
let GBL_chatMessages= [];

if ("paintWorklet" in CSS) {
	CSS.paintWorklet.addModule("https://www.unpkg.com/css-houdini-squircle/squircle.min.js");
}

// Contains the buttons and chatBox
const chatWrapper = document.createElement("div");
chatWrapper.setAttribute("id", "chatWrapper");
// chatWrapper.style.display = "block";

const chatBtnsWrapper = document.createElement("div");
chatBtnsWrapper.setAttribute("id", "chatBtnsWrapper");

// View Button
const viewSquircle = document.createElement("div");
viewSquircle.setAttribute("class", "squircleBtn viewBtn");
viewSquircle.onclick = function() {
	if (chatBoxWrapper.style.display == "block") {
		chatBoxWrapper.style.display = "none";
	} else {
		chatBoxWrapper.style.display = "block";
	}
}
const viewImg = document.createElement("img");
viewImg.src = chrome.runtime.getURL("view.png");
viewSquircle.appendChild(viewImg);
chatBtnsWrapper.appendChild(viewSquircle);

// Mic Button
const micSquircle = document.createElement("div");
micSquircle.setAttribute("class", "squircleBtn micBtn");
micSquircle.onclick = function() {
	if (GBL_aiActivated != true) audio();
}
const micImg = document.createElement("img");
micImg.src = chrome.runtime.getURL("mic.png");
micSquircle.appendChild(micImg);
chatBtnsWrapper.appendChild(micSquircle);

chatWrapper.appendChild(chatBtnsWrapper);

const chatBoxWrapper = document.createElement("div");
chatBoxWrapper.setAttribute("id", "chatBoxWrapper");
// chatBoxWrapper.style.display = "none";

// Blur Background
const chatBoxBlur = document.createElement("div");
chatBoxBlur.setAttribute("id", "chatBoxBlur");
chatBoxWrapper.appendChild(chatBoxBlur);

// Border
const chatBoxBorder = document.createElement("div");
chatBoxBorder.setAttribute("id", "chatBoxBorder");
chatBoxWrapper.appendChild(chatBoxBorder);

const chatBoxContent = document.createElement("div");
chatBoxContent.setAttribute("id", "chatBoxContent");
chatBoxWrapper.appendChild(chatBoxContent);

chatWrapper.appendChild(chatBoxWrapper);

document.body.appendChild(chatWrapper);

function FN_highlightContext(txt) {
	const matches = document.querySelectorAll('[data-id]');
	for (let i = 0; i < matches.length; i++) {
		let temp = matches[i].getAttribute("data-id");
		let keyTemp = temp.split('-');
		if (keyTemp.find(e => e == txt)) {
			if (document.getElementById("selected") != null) {
				document.getElementById("selected").parentElement.innerHTML = document.getElementById("selected").innerHTML;
			}
			matches[i].innerHTML = "<mark id='selected'>" + matches[i].innerHTML + "</mark>";
			matches[i].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
		}
	}
}

function addMessage(text, from, counter, ctxTxt) {
	GBL_chatMessages.push([text, from, counter, ctxTxt]);
	renderChat();
}

function updateMessage(text, from, counter, ctxTxt) {
	GBL_chatMessages[GBL_chatMessages.length - 1] = [text, from, counter, ctxTxt];
	renderChat();
}

function renderChat() {
	document.getElementById("chatBoxContent").innerHTML = "";
	for (const [msg, frm, ctr, ctxTxt] of GBL_chatMessages) {
		let msgEl = document.createElement("div");
		msgEl.setAttribute("class", frm+"Chat chatBubble");

		let txtEl = document.createElement("p");
		txtEl.innerText = msg;
		msgEl.appendChild(txtEl);

		if (ctxTxt && frm == "user") {
			let ctxEl = document.createElement("p");
			ctxEl.id = "ctxEl";
			ctxEl.innerText += ctxTxt;
			ctxEl.onclick = function() {
				FN_highlightContext(ctr);
			};
			msgEl.appendChild(ctxEl);
		}

		document.getElementById("chatBoxContent").appendChild(msgEl);
	}
	chatBoxContent.scrollTop = chatBoxContent.scrollHeight;
	chatBoxBlur.style.height = chatBoxContent.offsetHeight + "px";
	chatBoxBorder.style.height = chatBoxContent.offsetHeight + "px";
}

document.body.addEventListener('contextmenu', function(e) {	
	if (!e.altKey) return false;

	// Key Code part of Extension
	if (GBL_aiActivated) return false;

	e.preventDefault();

	GBL_aiActivated = true;

	const preciseSelect = window.getSelection().toString();
	console.log(preciseSelect);

	let userContext = preciseSelect ? preciseSelect : e.target.innerText;

	if (!userContext) return false;

	// Highlighting the Selected Text:
	if (document.getElementById("selected") != null) {
		if (e.target.getAttribute("id") != "selected") {
			console.log(document.getElementById("selected").parentElement.getElementsByTagName("*"));
			document.getElementById("selected").parentElement.innerHTML = document.getElementById("selected").innerHTML;
		}
	}
	if (e.target.getAttribute("id") != "selected") {
		if (preciseSelect) {
			console.log(e.target.getElementsByTagName("*"));
			e.target.innerHTML = e.target.innerHTML.replace(userContext, "<mark id='selected'>"+ userContext + "</mark>");
			console.log(e.target.getElementsByTagName("*"));
		} else {
			console.log(e.target.getElementsByTagName("*"));
			e.target.innerHTML = "<mark id='selected'>" + e.target.innerHTML + "</mark>";
			console.log(e.target.getElementsByTagName("*"));
		}
	}

	let temp = document.getElementById("selected").parentElement.getAttribute("data-id");
	document.getElementById("selected").parentElement.setAttribute("data-id", (temp ? (temp + "-") : "") + GBL_selectedCounter);

	// Whisper and GPT Computation
	audio(userContext, GBL_selectedCounter++);
});

function audio(userContext, counter) {
	// Maybe delete this line afterwards and instead show the info via the mic and view buttons.
	chatBoxWrapper.style.display = "block";

	// To Test
	// addMessage('Testing', "user", counter, userContext);
	// addMessage('Testing', "ai", counter);
	// return;

	navigator.mediaDevices
	.getUserMedia({ audio: true, })
	.then((stream) => {
		let mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.start();
		GBL_micActivated = true;

		let audioContext = new AudioContext();
		let source = audioContext.createMediaStreamSource(stream);
		let analyser = audioContext.createAnalyser();
		source.connect(analyser);

		const pcmData = new Float32Array(analyser.fftSize);

		let frameCount = 0;
		const onFrame = () => {
			if (!GBL_micActivated) return false;
			analyser.getFloatTimeDomainData(pcmData);
			let sumSquares = 0.0;
			for (const amplitude of pcmData) { sumSquares += amplitude*amplitude; }
			// volumeMeterEl.value = Math.sqrt(sumSquares / pcmData.length);
			let volumeMeter = Math.round(Math.sqrt(sumSquares / pcmData.length)*1000);
			if (volumeMeter < 30) {
				frameCount++;
			} else {
				frameCount = 0;
			}
			if (frameCount >= 50) {
				mediaRecorder.stop();
				stream.getTracks().forEach(t => t.stop());
			}
			window.requestAnimationFrame(onFrame);
		};
		window.requestAnimationFrame(onFrame);


		// Visualizer canvas
		let userChat = document.createElement('div');
		userChat.setAttribute('class', 'userChat chatBubble');

		let canvas = document.createElement('canvas');
		let canvasCtx = canvas.getContext('2d');
		userChat.appendChild(canvas);

		if (userContext) {
			let userCtxP = document.createElement('p');
			userCtxP.setAttribute('id', 'ctxEl');
			userCtxP.innerHTML = userContext;
			userChat.appendChild(userCtxP);
		}

		document.getElementById("chatBoxContent").appendChild(userChat);

		// Visualizer loop
		function draw() {
			requestAnimationFrame(draw);
	
			let bufferLength = analyser.frequencyBinCount;
			let dataArray = new Uint8Array(bufferLength);

			analyser.getByteTimeDomainData(dataArray);
	
			canvas.width = 220;
			canvas.height = 20;
	
			canvasCtx.fillStyle = '#00402E';
			canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
	
			canvasCtx.lineWidth = 2;
			canvasCtx.strokeStyle = '#00FFB9';
	
			canvasCtx.beginPath();
	
			let sliceWidth = canvas.width * 1.0 / bufferLength;
			let x = 0;

			for (let i = 0; i < bufferLength; i++) {
				let v = dataArray[i] / 128.0;
				let y = v * canvas.height / 2;
	
				if (i === 0) {
					canvasCtx.moveTo(x, y);
				} else {
					canvasCtx.lineTo(x, y);
				}
	
				x += sliceWidth;
			}
			canvasCtx.stroke();
		}
	
		draw();

		chatBoxContent.scrollTop = chatBoxContent.scrollHeight;
		chatBoxBlur.style.height = chatBoxContent.offsetHeight + "px";
		chatBoxBorder.style.height = chatBoxContent.offsetHeight + "px";

		// Displaying
		mediaRecorder.ondataavailable = e => {
			GBL_micActivated = false;

			addMessage("Processing...", "user", counter, userContext);

			const formData = new FormData();
			formData.append('audio', e.data, 'recording.webm');
			fetch('https://9074-2604-3d08-6080-5500-e3f6-9e9-bb06-8b5a.ngrok-free.app/audio', {
				method: 'POST',
				body: formData,
			})
			.then((response) => (response.json()))
			.then((dataStr) => {
				let userQuery = dataStr.text;

				updateMessage(userQuery, "user", counter, userContext);

				addMessage("Processing", "ai", counter);

				// GPT
				let formDataGPT = new FormData();
				formDataGPT.append('string1', userQuery);
				if (userContext) formDataGPT.append('string2', userContext);
				
				fetch('https://9074-2604-3d08-6080-5500-e3f6-9e9-bb06-8b5a.ngrok-free.app/gpt', {
					method: 'POST',
					body: formDataGPT,
				})
				.then((response) => (response.json()))
				.then((dataStr) => {

					updateMessage(dataStr.text, "ai", counter);

					GBL_aiActivated = false;
				})
				.catch((err) => console.log(err));
			})
			.catch((err) => console.log(err));
		};
	})
	.catch((err) => console.log(err))
}