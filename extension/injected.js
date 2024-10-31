"use strict";

// execution context: world.MAIN

/*window.addEventListener("myEvent", function(event) {
	console.log("myEvent happened!", event);
});*/

(function(){
	console.log("injected.js: hello I have been successfully injected");

	function hook_proto(clazz, method_name, hook_impl) {
		const orig_impl = clazz.prototype[method_name];

		// can't use arrow syntax because we need "this"
		clazz.prototype[method_name] = function() {
			return hook_impl(this, orig_impl.bind(this), arguments);
		}

		// TODO: try to hide the hook from anyone doing introspection
	}

	hook_proto(window.MediaSource, "addSourceBuffer", (self, orig, [mimeType]) => {
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
	hook_proto(window.MediaSource, "endOfStream", (self, orig, [endOfStreamError]) => {
		console.log("injected.js: hooked MediaSource.endOfStream", endOfStreamError);
		return orig(endOfStreamError);
	});

	hook_proto(window.MediaSource, "removeSourceBuffer", (self, orig, [sourceBuffer]) => {
		console.log("injected.js: hooked MediaSource.removeSourceBuffer", sourceBuffer._hook_mimeType, sourceBuffer);
		return orig(sourceBuffer);
	});


	hook_proto(window.SourceBuffer, "appendBuffer", (self, orig, [source]) => {
		console.log("injected.js: hooked SourceBuffer.appendBuffer", self._hook_mimeType, source);
		return orig(source);
	});

	hook_proto(window.SourceBuffer, "abort", (self, orig) => {
		console.log("injected.js: hooked SourceBuffer.abort", self._hook_mimeType);
		// TODO: probably trigger the stream to get saved?
		return orig();
	});

	hook_proto(window.SourceBuffer, "changeType", (self, orig, [type]) => {
		console.log("injected.js: hooked SourceBuffer.changeType", self._hook_mimeType, type);
		self._hook_mimeType = type;
		return orig(type);
	});

	// shouldn't need to hook this for functionality but nice to see logs anyway
	hook_proto(window.SourceBuffer, "remove", (self, orig, [start, end]) => {
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

	window.addEventListener("message", (event) => {
		// TODO: security checks!!!!
		
		//console.log("world.MAIN received message", event, mouse_x, mouse_y);

		if (event.data.type != "my_extension_context_click") {
			return;
		}

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
	});

	// TODO: hook window.addEventListener("message", ...) to hide our messages from subsequently registered listeners
})();
