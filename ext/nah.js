let GBL_micActivated = false;

if ("paintWorklet" in CSS) {
	CSS.paintWorklet.addModule(
		"https://www.unpkg.com/css-houdini-squircle/squircle.min.js"
	);
}

// Contains the buttons and chatBox
const chatWrapper = document.createElement("div");
chatWrapper.setAttribute("id", "chatWrapper");

const chatBtnsWrapper = document.createElement("div");
chatBtnsWrapper.setAttribute("id", "chatBtnsWrapper");


// View Button
const viewSquircle = document.createElement("div");
viewSquircle.setAttribute("class", "squircleBtn viewBtn");

const viewImg = document.createElement("img");
viewImg.src = chrome.runtime.getURL("view.png");
// viewImg.onclick = function() {
// 	if (chatBox.style.display == "") {
// 		chatBoxBlur.style.display = "none";
// 		chatBox.style.display = "none";
// 	} else {
// 		chatBox.style.display = "";
// 		chatBoxBlur.style.display = "none";
// 	}
// }
viewSquircle.appendChild(viewImg);
chatBtnsWrapper.appendChild(viewSquircle);

// Mic Button
const micSquircle = document.createElement("div");
micSquircle.setAttribute("class", "squircleBtn micBtn");

const micImg = document.createElement("img");
micImg.src = chrome.runtime.getURL("mic.png");
// // micImg.onclick = function() {
// // 	if (micActivated != true) {
// // 		audio("");
// // 	}
// // }
micSquircle.appendChild(micImg);
chatBtnsWrapper.appendChild(micSquircle);

chatWrapper.appendChild(chatBtnsWrapper);

const chatBoxWrapper = document.createElement("div");
chatBoxWrapper.setAttribute("id", "chatBoxWrapper");
chatBoxWrapper.style.display = "none";

// Blur Background
const chatBoxBlur = document.createElement("div");
chatBoxBlur.setAttribute("id", "chatBoxBlur");
chatBoxWrapper.appendChild(chatBoxBlur);
// chatBoxBlur.style = "--squircle-smooth: .9";

// Border
const chatBoxBorder = document.createElement("div");
chatBoxBorder.setAttribute("id", "chatBoxBorder");
chatBoxWrapper.appendChild(chatBoxBorder);

const chatBoxContent = document.createElement("div");
chatBoxContent.setAttribute("id", "chatBoxContent");
chatBoxWrapper.appendChild(chatBoxContent);

chatWrapper.appendChild(chatBoxWrapper);

document.body.appendChild(chatWrapper);

function addMessage(text, from="user", createNew=false)
{
	if (createNew)
	{
		document.getElementById("chatBoxContent").innerHTML += "<div class='"+from+"Chat chatBubble'>"+text+"</div>";
	}
	else
	{
		document.getElementById("chatBoxContent").lastChild.innerHTML = text;
	}

	chatBoxBlur.style.height = chatBoxContent.offsetHeight + "px";
	chatBoxBorder.style.height = chatBoxContent.offsetHeight + "px";
}

// chatBoxWrapper.style.display = "block";
// addMessage('Recording1...', from="user", createNew=true)
// addMessage('Recording2...', from="ai", createNew=true)
// addMessage('Recording3...', from="user", createNew=true)
// addMessage('Recording4...', from="ai", createNew=true)
// addMessage('Recording5...', from="user", createNew=true)

document.body.addEventListener('contextmenu', function(e) {	
	if (!e.altKey) return false;

	e.preventDefault();
	let userQuery = e.target.innerText;

	if (!userQuery) return false;

	// Highlighting the Selected Text:
	if (document.getElementById("selected") != null) {
		document.getElementById("selected").parentElement.innerHTML = document.getElementById("selected").innerHTML;
	}
	e.target.innerHTML = "<mark id='selected'>" + e.target.innerHTML + "</mark>";

	chatBoxWrapper.style.display = "block";

	// addMessage('hello')
	// addMessage('hi', 'ai')
	// addMessage('whats up')

	// -------
	navigator.mediaDevices
	.getUserMedia({ audio: true, })
	.then((stream) => {
		// console.log(stream);
		let mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.start();
		// micActivated = true;

		// Displaying
		addMessage('Recording...', from="user", createNew=true)
		// userChatUI();
		// updateTXT("Recording");
		// chatBox.scrollTop = chatBox.scrollHeight;
		// console.log(chatBox.offsetHeight);
		// chatBoxBlur.style.height = chatBox.offsetHeight;

		mediaRecorder.ondataavailable = e => {
			addMessage("Processing...")

			const formData = new FormData();
			formData.append('audio', e.data, 'recording.webm');
			fetch('https://e6ce-2604-3d08-6080-5500-8b6c-a62c-b485-c757.ngrok-free.app/audio', {
				method: 'POST',
				body: formData,
			})
			.then((response) => (response.json()))
			.then((dataStr) => {
				let userAction = dataStr.text;

				addMessage(userAction)

				addMessage("Processing", from="ai", createNew=true)

				// GPT
				let formDataGPT = new FormData();
				formDataGPT.append('string1', userAction);
				if (userQuery) {
					formDataGPT.append('string2', userQuery);
				}
				
				fetch('https://e6ce-2604-3d08-6080-5500-8b6c-a62c-b485-c757.ngrok-free.app/gpt', {
					method: 'POST',
					body: formDataGPT,
				})
				.then((response) => (response.json()))
				.then((dataStr) => {
					addMessage(dataStr.text);
					// micActivated = false;
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