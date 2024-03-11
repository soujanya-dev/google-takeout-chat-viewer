/* @refresh reload */
import { render } from "solid-js/web";

import '../node_modules/modern-normalize/modern-normalize.css';
import "../node_modules/chota/dist/chota.min.css";
import "./styles.css";
import App from "./App";

render(() => <App />, document.getElementById("root") as HTMLElement);
