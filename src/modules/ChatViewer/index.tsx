import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api";

import { listen } from "@tauri-apps/api/event";

import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import SearchResults from "./SearchResults";

// import ui components
import { HoverCard, Splitter } from "@ark-ui/solid";
import { Portal } from "solid-js/web";

// import icons

function ChatViewer(props: any) {
	const [folderPath, setFolderPath] = createSignal("");
	const [activeChatPath, setActiveChatPath] = createSignal("");
	const [activeChatName, setActiveChatName] = createSignal("");
	const [activeChatRawData, setActiveChatRawData] = createSignal([]);
	const [fullChatData, setFullChatData] = createSignal([]);
	const [searchValue, setSearchValue] = createSignal("");
	const [searchResults, setSearchResults] = createSignal([]);
	const [showSearchResults, setShowSearchResults] = createSignal(false);
	const [searchClickInterval, setSearchClickInterval] = createSignal(undefined as any | undefined);
	const [searchClickedMessageId, setSearchClickedMessageId] = createSignal("");
	const [searchWordsToHighlight, setSearchWordsToHighlight] = createSignal([]);
	const [searchInActiveChat, setSearchInActiveChat] = createSignal(false);
	const [activeChatStartEnd, setActiveChatStartEnd] = createSignal({ start: 0, end: 0 });

	onMount(async () => {
		let chatData = props.chatData();
		if (chatData) {
			setFolderPath(chatData[0].base_path);
		}
		await listen("search_chat_data_results", (data) => {
			let payload = data.payload as any;
			payload = payload.map((i: any) => {
				let group = chatData[0].membership_info.find((j: any) => j.group_id.includes(i.message_id.split("/")[0]));
				let group_name = group ? getGroupName(group) : "Deleted User";
				return { ...i, group_name };
			});
			setSearchResults(searchResults().concat(payload));
		});
	});

	async function searchChatALl(event: any) {
		if (event.key !== "Enter") return;
		let searchValue = event.target.value || "";
		if (searchValue === "" || searchValue.length < 3) return;
		setSearchResults([]);
		invoke("search_chat_data", {
			chatPath: searchInActiveChat()?activeChatPath():props
				.chatData()[0]
				.membership_info.map((i: any) => i.path)
				.join(","),
			searchTerm: searchValue,
		})
			.catch((e) => {
				props.toast().create({ title: "Error", description: e });
			})
			.then((data: any) => {
				setSearchWordsToHighlight(data.split("/~#sep#~/"));
				setShowSearchResults(true);
				setSearchValue(searchValue);
			});
	}

	function getGroupName(group: any) {
		return group.group_name
			? group.group_name
			: group.group_members.length > 2
			? group.group_members
					.filter((member: any) => member.email !== props.chatData()[0].user.email)
					.map((member: any) => {
						return member.name.split(" ")[0];
					})
					.join(", ")
			: group.group_members.length === 2
			? group.group_members[1].name
			: "Deleted User";
	}

	async function chatNameOnClick(group_id: any, message_id: any) {
		try {
			if (searchClickInterval()) {
				clearInterval(searchClickInterval());
				setSearchClickInterval(undefined);
			}
			if (activeChatRawData().length > 0) {
				setActiveChatRawData([]);
			}
			setActiveChatStartEnd({ start: 0, end: 0 });
			let group = props.chatData()[0].membership_info.find((i: any) => i.group_id.includes(group_id));
			let data = await invoke("process_chat_file", { path: group.path }).catch((e) => {
				props.toast().create({ title: "Error", description: e });
			});
			setActiveChatPath(group.path);
			setActiveChatName(getGroupName(group));
			let parsedData = (JSON.parse(data as string) || {}).messages || [];
			let lastMessageId = parsedData[parsedData.length - 1].message_id;
			console.log("parsedData length", parsedData.length);
			let start_time = new Date().getTime();
			// store the full chat data
			setFullChatData(parsedData);
			if (message_id) {
				setSearchClickedMessageId(message_id);
			} else {
				if (parsedData.length > 0) {
					setSearchClickedMessageId(lastMessageId);
				}
			}
			// find the message_id in the parsedData and store 200 messages before and after it
			let index = parsedData.findIndex((i: any) => i.message_id === searchClickedMessageId());
			if (index === -1) {
				props.toast().create({ title: "Error", description: "Message not found" });
				return;
			}
			let start = index - 200;
			let end = index + 200;
			if (start < 0) {
				start = 0;
			}
			if (end > parsedData.length) {
				end = parsedData.length;
			}
			setActiveChatStartEnd({ start, end });
			parsedData = parsedData.slice(start, end);
			// create a task to periodically check if a element is created with the message_id and scroll to it
			setSearchClickInterval(
				setInterval(() => {
					let element = document.getElementById(searchClickedMessageId());
					if (element) {
						console.log("element found in", new Date().getTime() - start_time, "ms");
						element.scrollIntoView(true);
						clearInterval(searchClickInterval());
						setSearchClickInterval(undefined);
					}
				}, 100)
			);
			// set the active chat data
			setActiveChatRawData(parsedData);
			setShowSearchResults(false);
		} catch (e) {
			props.toast().create({ title: "Error", description: e });
		}
	}


	return (
		<div class="row">
			<div class="col">
				<div class="row is-center">
					<p class="text-center">Selected folder:</p>
					<HoverCard.Root>
						<HoverCard.Trigger onClick={() => props.setChatData(undefined)} class="text-center">
							{
								// if the folder path more than n characters, show the first n characters ... last n characters
								folderPath().length > 50 ? folderPath().slice(0, 25) + " ... " + folderPath().slice(-25) : folderPath()
							}
						</HoverCard.Trigger>
						<Portal>
							<HoverCard.Positioner class="min-width-override">
								<HoverCard.Content>
									<HoverCard.Arrow>
										<HoverCard.ArrowTip />
									</HoverCard.Arrow>
									{folderPath()}
								</HoverCard.Content>
							</HoverCard.Positioner>
						</Portal>
					</HoverCard.Root>
				</div>
			</div>
			<input
				class="search-messages"
				type="text"
				placeholder={"Search in " + (searchInActiveChat() ? activeChatName() : "all chats ")}
				autocorrect="off"
				autocomplete="off"
				onkeypress={searchChatALl}
				value={searchValue()}
			/>
			<div class="col-12 spacer" />
			<div class="row is-full-width">
				<Splitter.Root
					size={[
						{ id: "chat_list", size: 30 },
						{ id: "message_bdy", size: 70 },
					]}
					class="chat-splitter-root"
				>
					<Splitter.Panel id="chat_list" class="col">
						<ChatList
							toast={props.toast}
							chatData={props.chatData}
							setChatData={props.setChatData}
							setActiveChatPath={setActiveChatPath}
							activeChatPath={activeChatPath}
							setActiveChatName={setActiveChatName}
							setActiveChatRawData={setActiveChatRawData}
							getGroupName={getGroupName}
							chatNameOnClick={chatNameOnClick}
						/>
					</Splitter.Panel>
					<Splitter.ResizeTrigger id="chat_list:message_bdy" class="col" />
					<Splitter.Panel id="message_bdy" class="col">
						{showSearchResults() ? (
							<SearchResults
								searchValue={searchValue}
								searchResults={searchResults}
								searchWordsToHighlight={searchWordsToHighlight}
								searchInActiveChat={searchInActiveChat}
								activeChatName={activeChatName}
								chatData={props.chatData}
								chatNameOnClick={chatNameOnClick}
								getGroupName={getGroupName}
							/>
						) : (
							<ChatWindow
								toast={props.toast}
								chatData={props.chatData}
								getGroupName={getGroupName}
								activeChatName={activeChatName}
								activeChatRawData={activeChatRawData}
								setActiveChatRawData={setActiveChatRawData}
								fullChatData={fullChatData}
								activeChatStartEnd={activeChatStartEnd}
								setActiveChatStartEnd={setActiveChatStartEnd}
								searchClickedMessageId={searchClickedMessageId}
								searchClickInterval={searchClickInterval}
								searchValue={searchValue}
								setSearchValue={setSearchValue}
								setSearchResults={setSearchResults}
								setShowSearchResults={setShowSearchResults}
								setSearchInActiveChat={setSearchInActiveChat}
								searchInActiveChat={searchInActiveChat}
							/>
						)}
					</Splitter.Panel>
				</Splitter.Root>
			</div>
		</div>
	);
}

export default ChatViewer;
