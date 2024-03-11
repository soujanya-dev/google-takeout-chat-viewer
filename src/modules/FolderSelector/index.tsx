import { createSignal } from "solid-js";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api";

// import ui components


// import icons
import FaFolderOpen from "~icons/fa/folder-open";
import FaFolder from "~icons/fa/folder";

function FolderSelector(props: any) {
	const [folderPath, setFolderPath] = createSignal("");
	const [processing, setProcessing] = createSignal(false);

	async function handleSelectFolder() {
		try {
			const selectedPath = await open({
				directory: true,
				multiple: false,
			});
			// returns the folder path
			if (selectedPath) {
				if (typeof selectedPath === "string") {
					setFolderPath(selectedPath);
				} else {
					setFolderPath(selectedPath[0]);
				}
				setProcessing(true);
				// send the folder path to the rust side
				let result = await invoke("process_chat_folder", { folder_path: folderPath() }).catch((e) => {
					setProcessing(false);
					props.toast().create({ title: "Error", description: e });
				});
				setProcessing(false);
				if(result){
					try {
						let jsonResult = JSON.parse(result as string) as [any];
						if (jsonResult) {
							props.toast().create({ title: "Success", description: "Found chat data" });
							let chatUsersTags: any[] = [];
							jsonResult[0].membership_info.forEach((group: any) => {
								if (group.group_name && !chatUsersTags.includes(group.group_name)) {
									chatUsersTags.push(group.group_name);
								} else if (group.group_members.length > 2) {
									group.group_members.filter((member: any) => member.email !== jsonResult[0].user.email).forEach((member: any) => {
										if (!chatUsersTags.includes(member.name.split(" ")[0])) {
											chatUsersTags.push(member.name.split(" ")[0]);
										}
									});
								} else if (group.group_members.length === 2) {
									if (!chatUsersTags.includes(group.group_members[1].name.split(" ")[0])) {
										chatUsersTags.push(group.group_members[1].name.split(" ")[0]);
									}
								} else {
									if (!chatUsersTags.includes("Deleted User")) {
										chatUsersTags.push("Deleted User");
									}
								}
							});

							jsonResult[0].chatUsersTags = chatUsersTags;
							console.log("chatUsersTags", chatUsersTags);

							// store the chat data in the local storage
							localStorage.setItem("chatData", JSON.stringify(jsonResult));
							props.setChatData(jsonResult);
						}
					} catch (e) {
						const error = e as Error;
						props.toast().create({ title: "Error", description: error.message });
					}
				}
			}
		} catch (error) {
			console.error("Error selecting folder:", error);
		}
	}

	return (
		<div class="col-12 center-aligned">
			<p>Please select the folder where your chat data is located</p>
			{!processing() ? (
				<a class="icon-button" onClick={handleSelectFolder}>
					<FaFolder color="aqua" />
					<FaFolderOpen color="aqua" />
				</a>
			) : (
				<div class="col-12 center-aligned">
					<div class="wave-animation" style="--wave-index: 0;">
						.
					</div>
					<div class="wave-animation" style="--wave-index: 1;">
						.
					</div>
					<div class="wave-animation" style="--wave-index: 2;">
						.
					</div>
				</div>
			)}
			<br />
			{folderPath() && <p>Selected Folder: {folderPath()}</p>}
		</div>
	);
}

export default FolderSelector;
