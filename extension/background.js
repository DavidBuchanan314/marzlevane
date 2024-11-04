"use strict";

browser.contextMenus.create(
	{
		id: "marzlevane-context-menu-id",
		title: "Marzlevane: Save Video",
		contexts: ["all"], // TODO: do I really want "all"?
	},
	null, // should be a callback
);

browser.contextMenus.onClicked.addListener((info, tab) => {
	switch (info.menuItemId) {
		case "marzlevane-context-menu-id":
			console.log("doing the thing", info, tab);
			browser.tabs.sendMessage(tab.id, {
				type: "contextMenuClicked"
			}); // received by content.js in world.ISOLATED
			break;
	}
});

browser.runtime.onMessage.addListener((data, sender) => {
	console.log("received", data, sender);
	// todo: some kind of switch case on data

	if (data.type === "foundVideoElement") {
		let creating = browser.windows.create({
			type: "popup",
			url: "ui/panel.html",
			width: 640,
			height: 480,
		});
	} else if (data.type === "appendBuffer") {
		processAppendBuffer(data);
		//blob = data.type.
		//URL.revokeObjectURL(uri);
		//console.log("appendBuffer", data);
	} else {
		console.log("unhandled event", data);
	}

	
});

async function processAppendBuffer(event)
{
	const uri = event.data;
	const res = await fetch(uri); // TODO: consider security? validate that it's a blob URI?
	// the above fails with permission error, I think we need to do this but in reverse: https://stackoverflow.com/a/23856573/4454877
	const ab = await res.arrayBuffer();
	URL.revokeObjectURL(uri); // prevent leaking blob uris
	console.log("appendBuffer", ab);
}

let download_cleanup_handlers = {}
browser.downloads.onChanged.addListener((delta) => {
	console.log("delta", delta);
	let state = delta.state.current;
	if (state === "complete" || state === "interrupted") {
		if (download_cleanup_handlers[delta.id] !== undefined) {
			download_cleanup_handlers[delta.id](); // handler should remove itself from cleanup_handlers!
		}
	}
})


async function streamed_download(file_name, writer_callback) {
	const root = await navigator.storage.getDirectory();
	const temp_path = crypto.randomUUID() + ".tmp";
	const handle = await root.getFileHandle(temp_path, { create: true });
	const writable = await handle.createWritable();
	await writer_callback(writable);
	await writable.close();

	const file = await handle.getFile();
	const uri = URL.createObjectURL(file);
	console.log("downloading", uri);

	let resolver = null;
	const resolution_promise = new Promise((resolve, reject) => {
		resolver = resolve;
	});

	let download_id = await browser.downloads.download({
		url: uri,
		filename: file_name
	});

	// XXX: is there a race condition here??? could the download complete before re register our handler?

	download_cleanup_handlers[download_id] = async function() {
		console.log("download looks complete, cleaning up");
		URL.revokeObjectURL(uri);
		await root.removeEntry(temp_path);
		delete download_cleanup_handlers[download_id];
		resolver();
	};

	console.log("download_id", download_id);

	await resolution_promise;
}


async function filetest() {
	await streamed_download("myfile.txt", async function(writer) {
		await writer.write(new Uint8Array(10));
		await writer.write(new Uint8Array(10));
	});
	console.log("download maybe-complete");

	console.log("files:", await Array.fromAsync((await navigator.storage.getDirectory()).entries()));
}

//filetest();
