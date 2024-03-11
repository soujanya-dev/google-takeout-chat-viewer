import { createSignal, Index } from "solid-js";

// import ui components
import { HoverCard, TagsInput } from "@ark-ui/solid";
import { Portal } from "solid-js/web";

import CustomDatalist from "../CustomDatalist";

// import icons
import TdesignFilterClear from "~icons/tdesign/filter-clear";

function ChatList(props: any) {
	const [searchValue, setSearchValue] = createSignal("");
	const [searchInputValue, setSearchInputValue] = createSignal("");


	function searchChatList(items: any) {
		setSearchValue(items.value.join(","));
		let chatList = document.querySelector(".chat-splitter-root-panel");
		if (chatList) {
			chatList.scrollTop = 0;
		}
	}

	function searchFilter(group: any) {
		let groupNameArray = props.getGroupName(group).toLowerCase().split(",");
		let searchValueArray = searchValue().toLowerCase().split(",");
		let found = false;
		if (searchValue() === "") {
			return true;
		}
		if (groupNameArray.length == 1 && searchValueArray.length == 1) {
			if (groupNameArray[0].includes(searchValueArray[0])) {
				return true;
			}
		}
		let matchCount = 0;
		groupNameArray.forEach((groupName:string) => {
			searchValueArray.forEach((search) => {
				if (groupName.includes(search)) {
					matchCount++;
				}
			});
		});
		if (matchCount === searchValueArray.length) {
			found = true;
		}
		return found;
	}

	function chatListSort(a: any, b: any) {
		// put the most recent chat at the top based on the last message date
		let aDate = new Date(a.last_message_date);
		let bDate = new Date(b.last_message_date);
		return bDate.getTime() - aDate.getTime();
	}

	function dataListItemClick(value: string) {
		// focus the input 
		let input = document.getElementById("userSearch") as HTMLInputElement;
		input.focus();
		if(value===""){
			return;
		}
		if(searchValue()===""){
			searchChatList({value: [value]});
			return;
		}
		let oldSearchValue= searchValue().split(",");
		if(oldSearchValue.length>0 && oldSearchValue.map((i) => i.toLowerCase()).includes(value.toLowerCase())){
			return;
		}
		oldSearchValue.push(value);
		searchChatList({value: oldSearchValue});
	}

	return (
		<>
			<div class="autocomplete-container">
				<TagsInput.Root
					onValueChange={searchChatList}
					inputValue={searchInputValue()}
					allowEditTag={false}
					validate={(users) => {
						if (users.value.length > 0 && users.value.map((i) => i.toLowerCase()).includes(users.inputValue.toLowerCase())) {
							return false;
						}
						return true;
					}}
					value={searchValue() ? searchValue().split(",") : []}
				>
					{(api) => (
						<>
							<TagsInput.Control class="input pos-relative">
								<div class="row-flex">
									<Index each={api().value}>
										{(value, index) => (
											<TagsInput.Item index={index} value={value()} class="">
												<TagsInput.ItemPreview class="pos-relative">
													<TagsInput.ItemText>{value()}</TagsInput.ItemText>
												</TagsInput.ItemPreview>
												<TagsInput.ItemInput />
											</TagsInput.Item>
										)}
									</Index>
									<TagsInput.Input placeholder="Search Users" list="userList" id="userSearch" />
								</div>
								<TagsInput.ClearTrigger class="icon-button pos-right" title="Clear">
									<TdesignFilterClear font-size="0.7em" />
									<TdesignFilterClear font-size="0.7em" class="primary-button" />
								</TagsInput.ClearTrigger>
							</TagsInput.Control>
						</>
					)}
				</TagsInput.Root>
				<CustomDatalist items={props.chatData()[0].chatUsersTags} inputId="userSearch" setInputValue={setSearchInputValue} onItemClick={dataListItemClick}/>
			</div>
			<div class="col left-aligned scrollable chat-splitter-root-panel">
				{props
					.chatData()[0]
					.membership_info.filter((i: any) => searchFilter(i))
					.sort((a: any, b: any) => chatListSort(a, b))
					.map((group: any) => {
						return (
							<div class="row left-aligned full-width">
								<HoverCard.Root lazyMount={true} positioning={{ placement: "right", gutter: 12 }}>
									<HoverCard.Trigger
										class={"row is-full-width not-centered " + (props.activeChatPath() === group.path ? "selected" : "")}
										onClick={() => {
											props.chatNameOnClick(group.group_id);
										}}
									>
										{props.getGroupName(group)}
									</HoverCard.Trigger>
									<Portal>
										<HoverCard.Positioner class="min-width-override">
											<HoverCard.Content>
												<HoverCard.Arrow>
													<HoverCard.ArrowTip />
												</HoverCard.Arrow>
												<div class="row">
													<div class="col-12">
														<h2>
															{group.group_name || group.group_id.toLowerCase().includes("space")
																? "Spaces"
																: "Group Chat"}
														</h2>
														<p>{group.group_members.length} Members</p>
													</div>
													<div class="col-12">
														<div class="row">
															<div class="col-5 vertical-spacer">
																{group.group_members.map((member: any, index: number) => {
																	if (index % 2 === 0) {
																		return (
																			<div class="">
																				{/* <img src={member.photo} alt={member.name} /> */}
																				<p>{member.name ? member.name : member.email}</p>
																			</div>
																		);
																	}
																})}
															</div>
															<div class="col-1"></div>
															<div class="col-5 vertical-spacer">
																{group.group_members.map((member: any, index: number) => {
																	if (index % 2 !== 0) {
																		return (
																			<div class="">
																				{/* <img src={member.photo} alt={member.name} /> */}
																				<p>{member.name ? member.name : member.email}</p>
																			</div>
																		);
																	}
																})}
															</div>
														</div>
													</div>
												</div>
											</HoverCard.Content>
										</HoverCard.Positioner>
									</Portal>
								</HoverCard.Root>
							</div>
						);
					})}
			</div>
		</>
	);
}

export default ChatList;
