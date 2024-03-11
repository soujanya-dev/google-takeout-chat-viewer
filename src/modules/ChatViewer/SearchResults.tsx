import { For } from "solid-js";
import Mark from "mark.js";

// import ui components

function SearchResults(props: any) {
	return (
		<>
			<p class="center-aligned ellipsis">
				<span class="bold">Search Results for:</span> {props.searchValue()}
			</p>
			<p class="center-aligned ellipsis">
				{props.searchInActiveChat() ? (
					<>
						<span class="bold"> in </span> <span> {props.activeChatName()} </span>
					</>
				) : null}
			</p>
			<p class="center-aligned ellipsis">
				<span class="bold">found: </span>
				{props.searchResults().length} results
			</p>
			<div class="row scrollable not-centered chat-splitter-root-panel search-results">
				<For each={props.searchResults()} fallback={<p>No results found</p>}>
					{(result: any) => (
						<div
							class="col-12 chat-message button full-width"
							id={result.message_id}
							onclick={() => {
								props.chatNameOnClick(result.message_id.split("/")[0], result.message_id);
							}}
						>
							{props.searchInActiveChat() ? null : <h2>{result.group_name}</h2>}
							<p>
								<span class="bold">
									{props.searchInActiveChat() || result.group_name !== result.creator.name ? result.creator.name + ": " : null}
								</span>
								<span
									class="search-result-text"
									ref={(el) => {
										if (el) {
											setTimeout(() => {
												// console.log(el.textContent);
												let instance = new Mark(el);
												instance.mark(props.searchWordsToHighlight(), {
													separateWordSearch: false,
												});
											});
										}
									}}
								>
									{result.text}
								</span>
							</p>

							<p class="chat-date is-marginless">at {result.created_date.split("UTC")[0]}</p>
						</div>
					)}
				</For>
			</div>
		</>
	);
}

export default SearchResults;