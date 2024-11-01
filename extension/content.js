"use strict";

// execution context: world.ISOLATED

// receives from background.js, forwards to injected.js
browser.runtime.onMessage.addListener((data, sender) => {
	console.log("content.js: handling message!", data, sender);
	
	// received by injected.js in world.MAIN
	window.dispatchEvent(
		new window.CustomEvent(
			"marzlevaneContextMenuClickEvent", { detail: data }
		)
	);

	return Promise.resolve("done");
});

// receives from injected.js, forwards to background.js
window.addEventListener("marzlevaneLogEvent", (event) => {
	//console.log("temp log", event);
	browser.runtime.sendMessage(event.detail);
});
