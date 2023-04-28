// NEW 3

const squircle = document.createElement("div");
squircle.setAttribute("class", "squircle");
document.body.appendChild(squircle);




let micActivated = false;

const chatBoxWrapper = document.createElement("div");
chatBoxWrapper.setAttribute("id", "chatBoxWrapper");

const chatBox = document.createElement("div");
chatBox.setAttribute("id", "chatBox");
chatBoxWrapper.appendChild(chatBox);

const micBtn = document.createElement("img");
micBtn.setAttribute("id", "micBtn");
micBtn.src = chrome.runtime.getURL("mic.png");
micBtn.onclick = function() {
	if (micActivated != true) {
		audio();
	}
}
squircle.appendChild(micBtn);

const viewBtn = document.createElement("img");
viewBtn.setAttribute("id", "viewBtn");
viewBtn.src = chrome.runtime.getURL("smart.png");
viewBtn.onclick = function() {
	if (chatBox.style.display == "") {
		chatBox.style.display = "none";
	} else {
		chatBox.style.display = "";
	}
}
document.body.appendChild(viewBtn);

function userChatUI() {
	const userChat = document.createElement("div");
	userChat.setAttribute("class", "userChat");
	chatBox.appendChild(userChat);
}

function aiChatUI() {
	const aiChat = document.createElement("div");
	aiChat.setAttribute("class", "aiChat");
	chatBox.appendChild(aiChat);
}

function updateTXT(txt) {
	document.getElementById("chatBox").lastChild.innerHTML = txt;
}

document.body.addEventListener('contextmenu', function(e) {	
	if (!e.altKey) {
		return false;
	}
	
	e.preventDefault();
	const textVal = e.target.innerText;

	if (!textVal) {
		return false;
	}

	// Displaying element selected
	if (document.getElementById("selected") != null) {
		document.getElementById("selected").parentElement.innerHTML = document.getElementById("selected").innerHTML;
	}

	// var newSpan = document.createElement("span");
	// newSpan.setAttribute("id", "selected");
	// newSpan.innerHTML = textVal;
	// e.target.replaceChild(newSpan, e.target.firstChild);

	// e.target.innerHTML = "<span id='selected'>" + e.target.innerHTML + "</span>";
	e.target.innerHTML = "<mark id='selected'>" + e.target.innerHTML + "</mark>";

	let userAction = "";

	if (document.getElementById("chatBoxWrapper") == null) {
		document.body.appendChild(chatBoxWrapper);
		console.log(chatBox.style.display);
	}

	navigator.mediaDevices.getUserMedia({ audio: true, })
	.then((stream) => {
		console.log(stream);
		mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.start();
		micActivated = true;

		// Displaying
		userChatUI();
		viewBtn.style.visibility = "visible";
		micBtn.style.visibility = "visible";
		updateTXT("Recording");
		chatBox.scrollTop = chatBox.scrollHeight;
		// return;

		mediaRecorder.ondataavailable = e => {
			
			updateTXT("Processing");

			const formData = new FormData();
			formData.append('audio', e.data, 'recording.webm');
			fetch('https://e6ce-2604-3d08-6080-5500-8b6c-a62c-b485-c757.ngrok-free.app/audio', {
				method: 'POST',
				body: formData,
			})
			.then((response) => (response.json()))
			.then((dataStr) => {
				userAction = dataStr.text;

				updateTXT(userAction);
				chatBox.scrollTop = chatBox.scrollHeight;

				aiChatUI();
				updateTXT("Processing");
				chatBox.scrollTop = chatBox.scrollHeight;

				// GPT
				const formData2 = new FormData();
				formData2.append('string1', userAction);
				formData2.append('string2', textVal);
				
				fetch('https://e6ce-2604-3d08-6080-5500-8b6c-a62c-b485-c757.ngrok-free.app/gpt', {
					method: 'POST',
					body: formData2,
				})
				.then((response) => (response.json()))
				.then((dataStr) => {
					updateTXT(dataStr.text);
					chatBox.scrollTop = chatBox.scrollHeight;
					micActivated = false;
				})
				.catch((err) => console.log(err));
			})
			.catch((err) => console.log(err));
		};

		setTimeout(() => {
			mediaRecorder.stop();
			stream.getTracks().forEach(t => t.stop());
		}, 3000);
	})
	.catch((err) => console.log(err))
});

function audio() {
	let userAction = "";

	if (document.getElementById("chatBoxWrapper") == null) {
		document.body.appendChild(chatBoxWrapper);
		console.log(chatBox.style.display);
	}

	navigator.mediaDevices.getUserMedia({ audio: true, })
	.then((stream) => {
		console.log(stream);
		mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.start();
		micActivated = true;

		// Displaying
		userChatUI();
		viewBtn.style.visibility = "visible";
		micBtn.style.visibility = "visible";
		updateTXT("Recording");
		chatBox.scrollTop = chatBox.scrollHeight;

		mediaRecorder.ondataavailable = e => {
			
			updateTXT("Processing");

			const formData = new FormData();
			formData.append('audio', e.data, 'recording.webm');
			fetch('https://e6ce-2604-3d08-6080-5500-8b6c-a62c-b485-c757.ngrok-free.app/audio', {
				method: 'POST',
				body: formData,
			})
			.then((response) => (response.json()))
			.then((dataStr) => {
				userAction = dataStr.text;

				updateTXT(userAction);
				chatBox.scrollTop = chatBox.scrollHeight;

				aiChatUI();
				updateTXT("Processing");
				chatBox.scrollTop = chatBox.scrollHeight;

				// GPT
				const formData2 = new FormData();
				formData2.append('string1', userAction);
				
				fetch('https://e6ce-2604-3d08-6080-5500-8b6c-a62c-b485-c757.ngrok-free.app/gpt', {
					method: 'POST',
					body: formData2,
				})
				.then((response) => (response.json()))
				.then((dataStr) => {
					updateTXT(dataStr.text);
					chatBox.scrollTop = chatBox.scrollHeight;
					micActivated = false;
				})
				.catch((err) => console.log(err));
			})
			.catch((err) => console.log(err));
		};

		setTimeout(() => {
			mediaRecorder.stop();
			stream.getTracks().forEach(t => t.stop());
		}, 3000);
	})
	.catch((err) => console.log(err))
}