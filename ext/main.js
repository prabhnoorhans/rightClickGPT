document.body.addEventListener('contextmenu', function(e) {
	// console.log(e.altKey)
	if (!e.altKey) {
		return false;
	}

	e.preventDefault();
	const textVal = e.target.innerText;

	if (!textVal) {
		return false;
	}

	console.log(textVal);
	// console.log(window.getSelection().toString());

	navigator.mediaDevices.getUserMedia({ audio: true, })
	.then((stream) => {
		console.log(stream);
		mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.start();
		mediaRecorder.ondataavailable = e => {
			const formData = new FormData();
			formData.append('audio', e.data, 'recording.webm');
			formData.append('string', textVal);
			fetch('https://e6ce-2604-3d08-6080-5500-8b6c-a62c-b485-c757.ngrok-free.app/audio', {
				method: 'POST',
				body: formData,
			})
			.then((response) => (response.json()))
			.then((dataStr) => console.log(dataStr.text))
			.catch((err) => console.log(err));
		};
		// mediaRecorder.onstop = e => {
		// 	console.log(chunks);
		// }
		setTimeout(() => {
			mediaRecorder.stop();
			stream.getTracks().forEach(t => t.stop());
		}, 3000);
	})
	.catch((err) => console.log(err))
});