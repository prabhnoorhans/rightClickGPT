document.addEventListener("keydown", function(e) {
	if (e.altKey && e.metaKey && e.code === "KeyX") {
		chatWrapper.style.display == "block" ? chatWrapper.style.display = "none" : chatWrapper.style.display = "block";
	}
})

let GBL_aiActivated = false;
let GBL_micActivated = false;
let GBL_chatMessages= [];

if ("paintWorklet" in CSS) {
	CSS.paintWorklet.addModule("https://www.unpkg.com/css-houdini-squircle/squircle.min.js");
}

// Contains the buttons and chatBox
const chatWrapper = document.createElement("div");
chatWrapper.setAttribute("id", "chatWrapper");
chatWrapper.style.display = "none";

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

function addMessage(query, from, context) {
	GBL_chatMessages.push([query, from, context]);
	renderChat();
}

function updateMessage(query, from, context) {
	GBL_chatMessages[GBL_chatMessages.length - 1] = [query, from, context];
	renderChat();
}

function renderChat() {
	document.getElementById("chatBoxContent").innerHTML = "";
	for (const [query, from, context] of GBL_chatMessages) {
		let msgEl = document.createElement("div");
		msgEl.setAttribute("class", from + "Chat chatBubble");

		let queryEl = document.createElement("p");
		queryEl.innerText = query;
		msgEl.appendChild(queryEl);

		if (context && from == "user") {
			let contextEl = document.createElement("p");
			contextEl.id = "ctxEl";
			contextEl.className = "hide";
			let temp = context.replace(/(\r\n|\n|\r)/gm, "");
			contextEl.innerText += temp;
			contextEl.onclick = function() {
				contextEl.className == "hide" ? contextEl.className = "show" : contextEl.className = "hide";
				dynamicHeight();
			};
			msgEl.appendChild(contextEl);
		}

		document.getElementById("chatBoxContent").appendChild(msgEl);
	}
	dynamicHeight();
}

function dynamicHeight() {
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

	let userContext = preciseSelect ? preciseSelect : e.target.innerText;

	if (!userContext) return false;

	// Whisper and GPT Computation
	audio(userContext);
});

function audio(userContext) {
	// Maybe delete this line afterwards and instead show the info via the mic and view buttons.
	chatWrapper.style.display = "block";
	chatBoxWrapper.style.display = "block";

	// To Test
	// addMessage('[Testing]', "user", userContext);
	// addMessage('[Testing]', "ai");
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
			userCtxP.className = 'hide';
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
	
			canvas.width = 270;
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

		dynamicHeight();

		// Displaying
		mediaRecorder.ondataavailable = e => {
			GBL_micActivated = false;

			addMessage("Processing...", "user", userContext);

			const formData = new FormData();
			formData.append('audio', e.data, 'recording.webm');
			fetch('https://5997-2604-3d08-6080-5500-c1ff-b0bc-6ed9-fb31.ngrok-free.app/audio', {
				method: 'POST',
				body: formData,
			})
			.then((response) => (response.json()))
			.then((dataStr) => {
				let userQuery = dataStr.text;

				updateMessage(userQuery, "user", userContext);

				addMessage("Processing", "ai");

				// GPT
				let formDataGPT = new FormData();
				formDataGPT.append('string1', userQuery);
				if (userContext) formDataGPT.append('string2', userContext);
				
				fetch('https://5997-2604-3d08-6080-5500-c1ff-b0bc-6ed9-fb31.ngrok-free.app/gpt', {
					method: 'POST',
					body: formDataGPT,
				})
				.then((response) => (response.json()))
				.then((dataStr) => {

					updateMessage(dataStr.text, "ai");

					GBL_aiActivated = false;
				})
				.catch((err) => console.log(err));
			})
			.catch((err) => console.log(err));
		};
	})
	.catch((err) => console.log(err))
}