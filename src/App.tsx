import React, { Component } from "react";
import img from "./img.png";
import cfu from "./cfu.png";
import icontrivia from "./icontrivia.png";
import icontest from "./icontest.png";

declare module "csstype" {
	interface Properties {
		// Add a CSS Custom Property
		"--gradient-start"?: string;
		"--gradient-end"?: string;
	}
}

/*

console.log("----------RELOADING-----------");////

const canvas = document.createElement('canvas');
canvas.width = 30;
canvas.height = 30;
const context = canvas.getContext('2d');
document.body.appendChild(canvas);

make_base();

function imgDataToColorCode(imgData: [number, number, number, number]): string{
	return `rgba(${imgData[0]},${imgData[1]},${imgData[2]},${imgData[3]})`;
}

function make_base(){
	base_image = new Image();
	base_image.src = image;
	base_image.onload = () => {
		context.drawImage(base_image, 0, 0, 30, 30);
		console.log(imgDataToColorCode(context.getImageData(4, 4, 1, 1).data));
		console.log(imgDataToColorCode(context.getImageData(26, 26, 1, 1).data));
	}
}


function sendRequest(){
	return new Promise((resolve, reject) => {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				// Typical action to be performed when the document is ready:
				resolve(xhttp.response);
			}
		};
		xhttp.open("GET", "https://routinehub.co/api/v1/shortcuts/793/versions/latest", true);
		xhttp.send();
	});
}

let sc1 = document.getElementByID("sc1");
sc1.addEventListener("click", () => {
	sc1.classList.toggleClass("open");
})

*/

type RoutineHubShortcutData =
	| {
			result: "success";
			id: number;
			Version: string;
			URL: string;
			Notes: string;
			Release: string;
	  }
	| { result: "error"; message: string };

const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

async function downloadData(
	id: number,
	onProgress: (percent: number) => void
): Promise<RoutineHubShortcutData> {
	const time = Math.random() * 10000;
	const start = new Date().getTime();
	const ticker = setInterval(() => {
		onProgress((new Date().getTime() - start) / time);
		console.log(
			new Date().getTime() - start,
			(new Date().getTime() - start) / time,
			time
		);
	}, 100);
	await timeout(time);
	clearInterval(ticker);
	onProgress(1);
	switch (id) {
		case 793:
			return {
				result: "success",
				id: 7537,
				Version: "2.0",
				URL:
					"https://www.icloud.com/shortcuts/1366d595bb6d4348a95cad04e0116ef9",
				Notes:
					"New in version 2.0:\r\n+ Check For Updates was completelly rewritten from the ground up in ScPL!\r\n+ CFU now supports rollbacks. If the installed version is less than the latest version, you can do a rollback.\r\n+ There is a new fancy UI for updating shortcuts.\r\n+ A new integration method is available that is one less action and 100x less error-prone than the old one. Don't worry, shortcuts made for 1.0 will keep updating.\r\n+ You now get proper errors when your shortcut was integrated wrong, telling you the error and what you need to fix.\r\n+ CFU now supports capital letters in dictionaries!\r\n+ CFU now uses a Javascript version compare algorithm.",
				Release: "April 26, 2019"
			};
		case 1001:
			return {
				result: "success",
				id: 3596,
				Version: "1.2.3",
				URL:
					"https://www.icloud.com/shortcuts/61cf542ec5eb4e4786522e1af68ee8ed",
				Notes:
					"New in version 1.2.3:\r\n+ Question is now shown on the results screen",
				Release: "December 26, 2018"
			};
		case 2277:
			return {
				result: "success",
				id: 7560,
				Version: "4.5",
				URL:
					"https://www.icloud.com/shortcuts/379b4c3f52724548a6f49b2b5bf8bb5f",
				Notes:
					"- Removed 24 unnecessary \u201cSet Dictionary Value: GIF\u201d actions and added this code in the dictionary action above where all these used to be. In return, this cleans up code by 24 actions.\r\n\r\n- Removed 14 unnecessary \u2018Change Case\u2019 actions.\r\n\r\n- Improvement made for all Check for update support in the shortcut.\r\n\r\n- Total # of actions: 1,930",
				Release: "April 27, 2019"
			};
		case 816:
			return {
				result: "error",
				message: "Invalid shortcut. This shortcut is not published."
			};
		default:
			return {
				result: "error",
				message: "Invalid shortcut. No shortcut exists with this ID."
			};
	}
}

function semverCompare(
	a: string,
	b: string
): "NoChanges" | "UpdateAvailable" | "RollbackAvailable" {
	const pa = a.split(".");
	const pb = b.split(".");
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		let na = Number(pa[i]);
		let nb = Number(pb[i]);
		if (isNaN(na)) {
			na = 0;
		}
		if (isNaN(nb)) {
			nb = 0;
		}
		if (na > nb) {
			return "RollbackAvailable";
		}
		if (nb > na) {
			return "UpdateAvailable";
		}
	}
	return "NoChanges";
}

// function downloadData(id: number) {
// 	return new Promise((resolve, reject) => {
// 		const xhttp = new XMLHttpRequest();
// 		//eslint-disable-next-line func-names
// 		xhttp.onreadystatechange = function() {
// 			if (this.readyState === 4) {
// 				// Typical action to be performed when the document is ready:
// 				resolve(xhttp.response);
// 			}
// 		};
// 		xhttp.open(
// 			"GET",
// 			`https://routinehub.co/api/v1/shortcuts/${id}/versions/latest`,
// 			true
// 		);
// 		xhttp.send();
// 	});
// }

function imgDataToColorCode(imgData: Uint8ClampedArray): string {
	return `rgba(${imgData[0]},${imgData[1]},${imgData[2]},${imgData[3]})`;
}

type ShortcutProps = {
	img: string;
	name: string;
	downloadURL: string;
	routinehubID: number;
	localVersion: string;
};
class Shortcut extends Component<
	ShortcutProps,
	{
		open: boolean;
		gradientStartColor?: string;
		gradientEndColor?: string;
		publishedVersion?: string;
		description?: string;
		downloadURL?: string;
		percentComplete: number;
		error: boolean;
	}
> {
	constructor(props: Readonly<ShortcutProps>) {
		super(props);
		this.state = { open: false, error: false, percentComplete: 0 };
		this.findColor();
		this.downloadData();
	}
	findColor() {
		const canvas = document.createElement("canvas");
		canvas.width = 30;
		canvas.height = 30;
		const context = canvas.getContext("2d");
		if (!context) {
			return;
		}

		const base_image = new Image();
		base_image.src = this.props.img;
		base_image.onload = () => {
			context.drawImage(base_image, 0, 0, 30, 30);
			this.setState({
				gradientStartColor: imgDataToColorCode(
					context.getImageData(4, 4, 1, 1).data
				),
				gradientEndColor: imgDataToColorCode(
					context.getImageData(26, 26, 1, 1).data
				)
			});
		};
	}
	async downloadData() {
		const rhdata = await downloadData(this.props.routinehubID, percent => {
			this.setState({ percentComplete: percent });
		});
		if (rhdata.result === "error") {
			this.setState({
				description: `Error while checking for updates: ${
					rhdata.message
				}`,
				error: true
			});
			return;
		}
		this.setState({
			publishedVersion: rhdata.Version,
			description: rhdata.Notes,
			downloadURL: `https://routinehub.co/download/${rhdata.id}`
		});
	}
	render() {
		return (
			<div
				className="shortcut"
				id="sc1"
				onClick={() => {
					this.setState({ open: !this.state.open });
				}}
				style={{
					"--gradient-start": this.state.gradientStartColor,
					"--gradient-end": this.state.gradientEndColor
				}}
			>
				<div
					className={`progress ${
						this.state.percentComplete === 1 ? "loaded" : ""
					}`}
					style={{
						width: `${100 -
							+this.state.percentComplete.toFixed(2) * 100}%`
					}}
				/>
				<div className="short">
					<img
						className="icon"
						src={this.props.img}
						alt={this.props.name}
					/>
					<div className={`details ${this.state.open ? "open" : ""}`}>
						<div />
						<p>{this.props.name}</p>
						<div
							className={`description ${
								this.state.open ? "open" : ""
							}`}
						>
							{this.state.description || "..."}
						</div>
					</div>
					<div className="buttons">
						<div className="blank" />
						<a
							className="button getversion"
							href={
								this.state.downloadURL ||
								`javascript:alert("Error")`
							}
							onClick={e => e.stopPropagation()}
							target="_blank"
							rel="noopener"
						>
							<div className="text">
								{this.state.error
									? "Error"
									: `${
											this.state.open
												? this.props.localVersion
												: ""
									  } → ${this.state.publishedVersion ||
											"..."}`}
							</div>
						</a>
						<div className="blank" />
					</div>
				</div>
				<div className={`fullcontent ${this.state.open ? "open" : ""}`}>
					<p className="fulldescription">
						{this.state.description || "..."}
					</p>
				</div>
			</div>
		);
	}
}

class App extends Component<{}, {}> {
	render() {
		return (
			<div className="content">
				<Shortcut
					img={img}
					name={"ALL THE GIFs!"}
					localVersion={"1.2.2"}
					downloadURL={"https://routinehub.co/download/7560"}
					routinehubID={2277}
				/>
				<Shortcut
					img={cfu}
					name={"Check For Updates"}
					localVersion={"1.2.2"}
					downloadURL={"https://routinehub.co/download/7537"}
					routinehubID={793}
				/>
				<Shortcut
					img={icontrivia}
					name={"Trivia"}
					localVersion={"1.2.2"}
					downloadURL={"https://routinehub.co/download/7537"}
					routinehubID={1001}
				/>
				<Shortcut
					img={icontest}
					name={"Secret Shortcut"}
					localVersion={"1.2.2"}
					downloadURL={"https://routinehub.co/download/7537"}
					routinehubID={816}
				/>
			</div>
		);
	}
}
export default App;
