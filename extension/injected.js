"use strict";

// execution context: world.MAIN

(function(){
	console.log("injected.js: hello I have been successfully injected");

	function transmitEvent(msg) {
		window.dispatchEvent(
			new window.CustomEvent(
				"marzlevanePage2ExtensionEvent", { detail: msg }
			)
		);
	}

	function hook(obj, method_name, hook_impl) {
		const orig_impl = obj[method_name];

		// can't use arrow syntax because we need "this"
		obj[method_name] = function() {
			return hook_impl(this, orig_impl.bind(this), arguments);
		}

		// TODO: try to hide the hook from anyone doing introspection
	}

	hook(window.MediaSource.prototype, "addSourceBuffer", (self, orig, [mimeType]) => {
		console.log("injected.js: hooked MediaSource.addSourceBuffer", mimeType);
		let res = orig(mimeType);
		console.log("injected.js: res", res);
		if (res) { // if not undefined, I guess
			res._hook_mimeType = mimeType;
		}
		// TODO: maybe hook the SourceBuffer *instance*, here? Then we could have mimeType closure'd instead of tacking it on
		return res;
	});

	// I think we can use this to determine when the video has ended
	hook(window.MediaSource.prototype, "endOfStream", (self, orig, [endOfStreamError]) => {
		console.log("injected.js: hooked MediaSource.endOfStream", endOfStreamError);
		return orig(endOfStreamError);
	});

	hook(window.MediaSource.prototype, "removeSourceBuffer", (self, orig, [sourceBuffer]) => {
		console.log("injected.js: hooked MediaSource.removeSourceBuffer", sourceBuffer._hook_mimeType, sourceBuffer);
		return orig(sourceBuffer);
	});

	// pretend we don't support webm, for now
	// (really, we should pretend to only support mp4)
	hook(window.MediaSource, "isTypeSupported", (self, orig, [type]) => {
		let mime = type.split(";")[0];
		let res = orig(type);
		if (mime == "video/webm" || mime == "audio/webm") {
			res = false;
		}
		console.log("injected.js: hooked MediaSource.isTypeSupported", type, res);
		return res
	});



	hook(window.SourceBuffer.prototype, "appendBuffer", (self, orig, [source]) => {
		console.log("injected.js: hooked SourceBuffer.appendBuffer", self._hook_mimeType, source);
		const buf_blob = new Blob([source]);
		const blob_uri = URL.createObjectURL(buf_blob); // TODO: don't leak blobs!
		transmitEvent({
			type: "appendBuffer",
			data: blob_uri
		});
		return orig(source);
	});

	hook(window.SourceBuffer.prototype, "abort", (self, orig) => {
		console.log("injected.js: hooked SourceBuffer.abort", self._hook_mimeType);
		// TODO: probably trigger the stream to get saved?
		return orig();
	});

	hook(window.SourceBuffer.prototype, "changeType", (self, orig, [type]) => {
		console.log("injected.js: hooked SourceBuffer.changeType", self._hook_mimeType, type);
		self._hook_mimeType = type;
		return orig(type);
	});

	// shouldn't need to hook this for functionality but nice to see logs anyway
	hook(window.SourceBuffer.prototype, "remove", (self, orig, [start, end]) => {
		console.log("injected.js: hooked SourceBuffer.remove", self._hook_mimeType, start, end);
		return orig(start, end);
	});

	console.log("injected.js: done installing hooks");

	let mouse_x = 0;
	let mouse_y = 0;

	window.addEventListener("mousemove", (event) => {
		mouse_x = event.clientX;
		mouse_y = event.clientY;
	});

	window.addEventListener("marzlevaneExtension2PageEvent", (event) => {
		console.log("received", event);
		if (event.detail.type === "contextMenuClicked") {
			contextMenuClicked();
		} else {
			console.log("unhandled marzlevaneExtension2PageEvent", event);
		}
	});

	function contextMenuClicked() {
		console.log("world.MAIN received marzlevaneContextMenuClickEvent", mouse_x, mouse_y);
		console.log("right click at", mouse_x, mouse_y);

		const videos_under_mouse = [];
		for (const elem of document.getElementsByTagName("video")) {
			const bounds = elem.getBoundingClientRect();
			//console.log(bounds);
			if (
				   mouse_x < bounds.left
				|| mouse_x > bounds.right
				|| mouse_y < bounds.top
				|| mouse_y > bounds.bottom
			) {
				continue;
			};
		
			videos_under_mouse.push(elem);
		};

		console.log("found videos:", videos_under_mouse);

		if (videos_under_mouse.length == 0) {
			alert("Marzlevane Error: no video elements found (if the video hasn't started yet, try pressing play first)");
			return;
		}

		if (videos_under_mouse.length > 1) {
			alert("Marzlevane Error: too many video elements found! Not sure what to do...");
			return;
		}

		// TODO: something...
		transmitEvent({
			type: "foundVideoElement"
		});
	}

})();
