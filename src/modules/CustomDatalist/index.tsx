import { createSignal, onCleanup, onMount, createMemo, on, Index } from "solid-js";

function CustomDatalist({
	items,
	inputId,
	setInputValue,
	onItemClick,
}: {
	items: string[];
	inputId: string;
	setInputValue: (value: string) => void;
	onItemClick: (value: string) => void;
}) {
	const [inputEl, setInputEl] = createSignal<HTMLInputElement>();
	const [query, setQuery] = createSignal("");
	const [selectedIndex, setSelectedIndex] = createSignal(-1);
	const [inputInFocus, setInputInFocus] = createSignal(false);

	onMount(() => {
		const input = document.getElementById(inputId) as HTMLInputElement;
		if (input) {
			setInputEl(input);
		}
		input?.addEventListener("input", handleInput);
		input?.addEventListener("keydown", handleKeyDown);
		input?.addEventListener("focus", handleInputFocus, { capture: true });
		input?.addEventListener("blur",handelInputBlur, { capture: true });
	});

	onCleanup(() => {
		inputEl()?.removeEventListener("input", handleInput);
		inputEl()?.removeEventListener("keydown", handleKeyDown);
		inputEl()?.addEventListener("focus", handleInputFocus, { capture: true });
		inputEl()?.addEventListener("blur",handelInputBlur, { capture: true });
	});

	on(query, () => {
		setSelectedIndex(-1); // Reset selection on query change
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		setQuery(target.value);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			setQuery("");
		} else if (e.key === "ArrowDown") {
			setSelectedIndex((index) => (index + 1) % filteredItems().length);
			inputEl()!.value = filteredItems()[selectedIndex()];
		} else if (e.key === "ArrowUp") {
			setSelectedIndex((index) => (index > 0 ? index - 1 : filteredItems().length - 1));
			inputEl()!.value = filteredItems()[selectedIndex()];
		} else if (e.key === "Enter" && selectedIndex() >= 0) {
			setInputValue(filteredItems()[selectedIndex()]);
			setQuery("");
		}
	}

	function handleItemClick(index: number) {
		onItemClick(filteredItems()[index]);
		setInputValue("");
		setQuery("");
	}

	function handelInputBlur() {
		setTimeout(() => setInputInFocus(false),200);
	}

	function handleInputFocus() {
		setTimeout(() =>setInputInFocus(true),210);
	}

	const filteredItems = createMemo(() => items.filter((item) => item.toLowerCase().startsWith(query().toLowerCase())));

	return (
		<div class={"autocomplete-results" + (query().length && filteredItems().length && inputInFocus() ? " show" : "")}>
			<ul>
				<Index each={filteredItems()}>
					{(item, index) => (
						<li class={selectedIndex() === index ? "selected" : ""} onclick={() => handleItemClick(index)}>
							{item()}
						</li>
					)}
				</Index>
			</ul>
		</div>
	);
}

export default CustomDatalist;
