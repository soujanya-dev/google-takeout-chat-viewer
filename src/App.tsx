import { createSignal, onMount } from "solid-js";
// import logo from "./assets/logo.svg";
import FolderSelector from "./modules/FolderSelector";
import ChatViewer from "./modules/ChatViewer";
// import DefaultApp from "./modules/defaultApp";
import "./App.css";

import FaClose from "~icons/fa/close";

// ui components
import { Toast, createToaster } from "@ark-ui/solid";

function App() {

	const [chatData, setChatData] = createSignal(null);

    const [Toaster, toast] = createToaster({
      placement: "top-end",
      duration: 1500,
      render(toast) {
        return (
          <Toast.Root class={toast().title ? toast().title?.toString().toLowerCase() : ""}>
            <Toast.Title>{toast().title}</Toast.Title>
            <Toast.Description>{toast().description}</Toast.Description>
            <Toast.CloseTrigger>
              <FaClose />
            </Toast.CloseTrigger>
          </Toast.Root>
        );
      },
    });

    onMount(async () => {
		// check if the chat data is already in the local storage
		if (localStorage.getItem("chatData")) {
			try {
				let result = JSON.parse(localStorage.getItem("chatData") as string);
				if (result) {
					setChatData(result);
				}
			} catch (e) {
				toast().create({ title: "Error", description: "Unable to load previous chat data" });
			}
		}
	});
  

  return (
		<>
			{chatData() ? (
				<div class="container">
					<ChatViewer toast={toast} chatData={chatData} setChatData={setChatData} />
				</div>
			) : (
				<div class="container">
					{/* <DefaultApp /> */}
					<br class="col-12" />
					<br class="col-12" />
					<br class="col-12" />
					<br class="col-12" />
					<br class="col-12" />
					<div class="row">
						<br class="col-12" />
						<br class="col-12" />
						<br class="col-12" />
						<br class="col-12" />
						<h1 class="col-12 center-aligned">Welcome to Google Takeout Chat Viewer 📦</h1>
						<FolderSelector toast={toast} setChatData={setChatData} />
					</div>
				</div>
			)}
			<Toaster />
		</>
  );
}

export default App;
