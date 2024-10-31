"use strict";

browser.contextMenus.create(
	{
		id: "my-context-menu-id",
		title: "Hydrocoptic Marzlevane",
		contexts: ["all"], // TODO: do I really want "all"?
	},
	null,
);

browser.contextMenus.onClicked.addListener((info, tab) => {
	switch (info.menuItemId) {
		case "my-context-menu-id":
			console.log("doing the thing", info, tab);
			browser.tabs.sendMessage(tab.id, "hello from background.js"); // received by content.js in world.ISOLATED
			break;
	}
});
