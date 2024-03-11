import { For } from "solid-js";
import { parse, format } from "date-fns";

import FaSearch from "~icons/fa/search";
import FaArrowLeft from "~icons/fa/arrow-left";
import FaClose from "~icons/fa/close";

function ChatWindow(props: any) {
	function getDayAndTime(date: string) {
		// return ''
		try {
			date = date.replace(/\u202F/g, " ");
			const parsedDate = parse(date, "EEEE, MMMM d, yyyy 'at' h:mm:ss a 'UTC'", new Date());
			return format(parsedDate, "EEE, h:mm a");
		}catch (e) {
			console.log(e,date);
			return 'Invalid Date';
		}
	}
	function getDateYear(date: string) {
		// return ''
		try {
			date = date.replace(/\u202F/g, " ");
			const parsedDate = parse(date, "EEEE, MMMM d, yyyy 'at' h:mm:ss a 'UTC'", new Date());
			return format(parsedDate, "MMMM d, yyyy");
		}catch (e) {
			console.log(e, date);
			return 'Invalid Date';
		}
	}
	function loadMoreMessages(e:any){
		// load more messages
		if (props.activeChatRawData().length > 0 && !props.searchClickInterval()) {
			if (e.target.scrollTop === 0) {
				console.log("load more messages from the top... current start", props.activeChatStartEnd().start);
				if (props.activeChatStartEnd().start === 0) {
					return;
				}
				disableScroll();
				let oldStartElement = document.getElementById(props.activeChatRawData()[0].message_id);
				let start = props.activeChatStartEnd().start - 200;
				if (start < 0) {
					start = 0;
				}
				props.setActiveChatStartEnd({ start, end: props.activeChatStartEnd().end });
				props.setActiveChatRawData(props.fullChatData().slice(start, props.activeChatStartEnd().end));
				let interval = setInterval(() => {
					// console.log("checking for new element", interval);
					let newStartElement = document.getElementById(props.activeChatRawData()[0].message_id);
					if (newStartElement) {
						// console.log("element found", interval);
						oldStartElement?.scrollIntoView(true);
						setTimeout(() => {
							enableScroll();
						}, 100);
						clearInterval(interval);
					}
				}, 50);
			} else if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight) {
				// console.log("load more messages from the bottom... current end", props.activeChatStartEnd().end);
				if (props.activeChatStartEnd().end === props.fullChatData().length) {
					return;
				}
				disableScroll();
				let oldEndElement = document.getElementById(props.activeChatRawData()[props.activeChatRawData().length - 1].message_id);
				let end = props.activeChatStartEnd().end + 200;
				if (end > props.fullChatData().length) {
					end = props.fullChatData().length;
				}
				props.setActiveChatStartEnd({ start: props.activeChatStartEnd().start, end });
				props.setActiveChatRawData(props.fullChatData().slice(props.activeChatStartEnd().start, end));
				let interval = setInterval(() => {
					// console.log("checking for new element", interval);
					let newEndElement = document.getElementById(props.activeChatRawData()[props.activeChatRawData().length - 1].message_id);
					if (newEndElement) {
						// console.log("element found end", interval);
						oldEndElement?.scrollIntoView(false);
						setTimeout(() => {
							enableScroll();
						}
						, 100);
						clearInterval(interval);
					}
				}, 50);
			}
		}
	}
	function disableScroll() {
		let element = document.querySelector(".chat-window.chat-splitter-root-panel") as HTMLElement;
		if (element) {
			element.style.overflow = "hidden";
		}
		
	}
	function enableScroll() {
		let element = document.querySelector(".chat-window.chat-splitter-root-panel") as HTMLElement;
		if (element) {
			element.style.overflow = "auto";
		}
	}
	return (
		<div class="row not-centered">
			{props.activeChatName().length > 0 ? (
				<div class="row chat-header splitter-header is-full-width">
					<button
						class="col-1 center-aligned icon-button"
						onClick={() => {
							props.setShowSearchResults(true);
						}}
						disabled={props.searchValue().length > 0 ? false : true}
						title="Go back to search results"
					>
						<FaArrowLeft font-size="0.5em" />
						<FaArrowLeft font-size="0.5em" class="primary-button" />
					</button>
					<p class={"col-10 chat-name center-aligned"}>
						{props.activeChatName().length > 120 ? props.activeChatName().slice(0, 117) + "..." : props.activeChatName()}
					</p>
					{!props.searchInActiveChat() ? (
						<button
							class="col-1 center-aligned icon-button is-full-width"
							onClick={() => {
								props.setSearchInActiveChat(true);
								props.setSearchValue("");
								props.setSearchResults([]);
							}}
							title="Search in this chat"
						>
							<FaSearch font-size="0.5em" />
							<FaSearch font-size="0.5em" class="primary-button" />
						</button>
					) : (
						<button
							class="col-1 center-aligned icon-button is-full-width"
							onClick={() => {
								props.setSearchInActiveChat(false);
								props.setSearchValue("");
								props.setSearchResults([]);
							}}
						>
							<FaClose font-size="0.5em" class="primary-button" />
							<FaClose font-size="0.5em" class="primary-button" />
						</button>
					)}
				</div>
			) : null}
			<div class="is-full-width scrollable not-centered chat-window chat-splitter-root-panel" onScroll={loadMoreMessages}>
				<For each={props.activeChatRawData()} fallback={<h4 class=" center-aligned">Select a chat to view</h4>}>
					{(i: any, index: any) => (
						<>
							{index() === 0 || getDateYear(props.activeChatRawData()[index() - 1].created_date) !== getDateYear(i.created_date) ? (
								<p class=" center-aligned-self bold ">{getDateYear(i.created_date)}</p>
							) : null}
							<div
								class={"col " + (i.creator.email === props.chatData()[0].user.email ? "right-aligned" : "left-aligned")}
								id={i.message_id}
							>
								{index() === 0 ||
								props.activeChatRawData()[index() - 1].creator.email !== i.creator.email ||
								getDateYear(props.activeChatRawData()[index() - 1].created_date) !== getDateYear(i.created_date) ? (
									<div class="col-12">
										<div class={"row center-aligned " + (i.creator.email === props.chatData()[0].user.email ? "reverse" : "")}>
											{i.creator.email === props.chatData()[0].user.email ? (
												<p class="chat-date">{getDayAndTime(i.created_date)}</p>
											) : null}
											<p class="user-name">{i.creator.name}</p>
											{i.creator.email !== props.chatData()[0].user.email ? (
												<p class="chat-date">{getDayAndTime(i.created_date)}</p>
											) : null}
										</div>
									</div>
								) : null}

								<p
									class={
										"row chat-message " + (i.message_id === props.searchClickedMessageId() ? "selected" : "") + " not-centered"
									}
								>
									{i.text}
								</p>
							</div>
						</>
					)}
				</For>
			</div>
		</div>
	);
}

export default ChatWindow;
