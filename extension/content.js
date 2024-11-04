"use strict";

// execution context: world.ISOLATED

// receives from background.js, forwards to injected.js
browser.runtime.onMessage.addListener((data, sender) => {
	//console.log("content.js: handling message!", data, sender);
	
	// received by injected.js in world.MAIN
	window.dispatchEvent(
		new window.CustomEvent(
			"marzlevaneExtension2PageEvent", {
				detail: cloneInto(data, window) // not sure why the cloneInto is only needed in this direction
			}
		)
	);

	return Promise.resolve("done"); // idk what this is for, I copy pasted from some sample code...
});

// receives from injected.js, forwards to background.js
window.addEventListener("marzlevanePage2ExtensionEvent", (event) => {
	browser.runtime.sendMessage(event.detail);
});
