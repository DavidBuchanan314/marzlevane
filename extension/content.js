"use strict";

// execution context: world.ISOLATED

// received from background.js
browser.runtime.onMessage.addListener((data, sender) => {
	console.log("content.js: handling message!", data, sender);
	
	// received by handler.js in world.MAIN
	window.dispatchEvent(
		new window.CustomEvent(
			"marzlevaneContextMenuClickEvent", {
				detail: {"blah": "my event!"}
			}
		)
	);

	return Promise.resolve("done");
});
