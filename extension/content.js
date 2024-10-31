"use strict";

// execution context: world.ISOLATED

// received from background.js
browser.runtime.onMessage.addListener((data, sender) => {
	console.log("content.js: handling message!", data, sender);
	
	// works but is DePrEcAtEd:
	//const event = document.createEvent("Event");
	//event.initEvent("myEvent");
	//window.dispatchEvent(event);

	// does not work:
	//const event = new window.CustomEvent("myEvent", "my event!")
	//window.dispatchEvent(event);

	// received by handler.js in world.MAIN
	window.postMessage({type: "my_extension_context_click"}); // does work but might confuse bad webpage code?

	return Promise.resolve("done");
});
