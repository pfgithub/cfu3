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
		"--progress"?: string;
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

function downloadData(
	id: number,
	onProgress: (percent: number) => void
): Promise<RoutineHubShortcutData> {
	return new Promise(resolve => {
		const xhttp = new XMLHttpRequest();
		xhttp.onprogress = e => {
			console.log("onprogress", e);
			if (e.lengthComputable) {
				onProgress(e.loaded / e.total);
			} else {
				onProgress(0.1);
			}
		};
		xhttp.onerror = e => {
			console.log(e);
			resolve({
				result: "error",
				message:
					"An error occured. This may be because you do not have internet access, or because the RoutineHub servers were unreachable, or because Harley Hicks has not enabled CORS."
			});
		};
		xhttp.onreadystatechange = () => {
			if (xhttp.readyState === 4) {
				onProgress(1);
				// Typical action to be performed when the document is ready:
				console.log("response:", xhttp);
				if (xhttp.response) {
					resolve(JSON.parse(xhttp.response));
				}
			}
		};
		xhttp.open(
			"GET",
			`https://routinehub.co/api/v1/shortcuts/${id}/versions/latest`,
			true
		);
		xhttp.send();
	});
}

type UpdateStatus = "NoChanges" | "UpdateAvailable" | "RollbackAvailable";
function semverCompare(a: string, b: string): UpdateStatus {
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

// 1.1.1 ↘ 1.0
// 1.9 → 2.2.1
// 1.5 = 1.5

function imgDataToColorCode(imgData: Uint8ClampedArray): string {
	return `rgba(${imgData[0]},${imgData[1]},${imgData[2]},${imgData[3]})`;
}

let updateArrows: { [key in UpdateStatus]: string } = {
	UpdateAvailable: "→",
	RollbackAvailable: "↘",
	NoChanges: "="
};

type ShortcutCategory =
	| "NeedUpdating"
	| "UpToDate"
	| "NeedRollback"
	| "Loading"
	| "Error";

let compareResultToCategory: { [key in UpdateStatus]: ShortcutCategory } = {
	NoChanges: "UpToDate",
	RollbackAvailable: "NeedRollback",
	UpdateAvailable: "NeedUpdating"
};

let categoryNames: { [key in ShortcutCategory]: string } = {
	NeedUpdating: "Update Available",
	UpToDate: "Up To Date",
	NeedRollback: "Rollback Required",
	Loading: "Loading...",
	Error: "Error"
};

type ShortcutProps = {
	img: string;
	name: string;
	routinehubID: number;
	localVersion: string;
	categorize: (category: ShortcutCategory) => void;
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
		updateStatus?: UpdateStatus;
		percentComplete: number;
		error: boolean;
		loading: boolean;
	}
> {
	constructor(props: Readonly<ShortcutProps>) {
		super(props);
		this.state = {
			open: false,
			error: false,
			percentComplete: 0,
			loading: true
		};
	}
	componentDidMount() {
		this.findColor();
		this.downloadData();
	}

	findColor() {
		const imgwidth = 8;
		const imgheight = 8;
		const imginsetlook = 1;

		const canvas = document.createElement("canvas");
		canvas.width = imgwidth;
		canvas.height = imgheight;
		const context = canvas.getContext("2d");
		if (!context) {
			return;
		}

		const base_image = new Image();
		base_image.src = this.props.img;
		base_image.onload = () => {
			context.drawImage(base_image, 0, 0, imgwidth, imgheight);
			this.setState({
				gradientStartColor: imgDataToColorCode(
					context.getImageData(imginsetlook, imginsetlook, 1, 1).data
				),
				gradientEndColor: imgDataToColorCode(
					context.getImageData(
						imgwidth - imginsetlook,
						imgheight - imginsetlook,
						1,
						1
					).data
				)
			});
		};
	}
	async downloadData() {
		const rhdata = await downloadData(this.props.routinehubID, percent => {
			this.setState({ percentComplete: percent });
		});
		if (rhdata.result === "error") {
			this.setState(
				{
					description: `Error while checking for updates: ${
						rhdata.message
					}`,
					loading: false,
					error: true
				},
				() => {
					this.props.categorize("Error");
				}
			);
			return;
		}
		let compareResult = semverCompare(
			this.props.localVersion,
			rhdata.Version
		);
		this.setState(
			{
				publishedVersion: rhdata.Version,
				description: rhdata.Notes,
				downloadURL: `https://routinehub.co/download/${rhdata.id}`,
				updateStatus: compareResult,
				loading: false
			},
			() => {
				this.props.categorize(compareResultToCategory[compareResult]);
			}
		);
	}
	render() {
		return (
			<div
				className={`shortcut ${this.state.loading ? "loading" : ""}`}
				id="sc1"
				onClick={() => {
					this.setState({ open: !this.state.open });
				}}
				style={{
					"--gradient-start": this.state.gradientStartColor,
					"--gradient-end": this.state.gradientEndColor
				}}
			>
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
							className={
								"button getversion " +
								(this.state.error ? "error" : "")
							}
							href={
								this.state.downloadURL ||
								`javascript:alert("Error")`
							}
							onClick={e => e.stopPropagation()}
							target="_blank"
							rel="noopener noreferrer"
						>
							<div className="text">
								{this.state.error
									? "Error"
									: this.state.updateStatus
									? `${
											this.state.open
												? this.props.localVersion
												: ""
									  } ${
											updateArrows[
												this.state.updateStatus
											]
									  } ${this.state.publishedVersion || "..."}`
									: `???`}
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
				{this.state.loading ? (
					<div
						className="progressoverlay"
						onClick={e => e.stopPropagation()}
					>
						<div />
						<div className="progresstext">Loading...</div>
						<div
							className={`progress ${
								this.state.percentComplete === 1 ? "loaded" : ""
							}`}
							style={{
								"--progress": `${+this.state.percentComplete.toFixed(
									2
								) * 100}%`
							}}
							role="progressbar"
							aria-valuenow={
								+this.state.percentComplete.toFixed(2) * 100
							}
							aria-valuemin={0}
							aria-valuemax={100}
						/>
					</div>
				) : null}
			</div>
		);
	}
}

type ShortcutDataBase = {
	img: string;
	name: string;
	localVersion: string;
	category: ShortcutCategory;
	uniqueid: string;
};

interface ShortcutDataRoutineHub extends ShortcutDataBase {
	service: "RoutineHub";
	id: number;
}

type ShortcutData = ShortcutDataRoutineHub;

const categoryOrder: ShortcutCategory[] = [
	"Loading",
	"Error",
	"NeedRollback",
	"NeedUpdating",
	"UpToDate"
];

class App extends Component<{}, { data: ShortcutData[] }> {
	constructor(props: Readonly<{}>) {
		super(props);
		this.state = {
			data: [
				{
					name: "ALL THE GIFs!",
					uniqueid: "ALL THE GIFs!",
					category: "Loading",
					img: img,
					localVersion: "9.2",
					service: "RoutineHub",
					id: 2277
				},
				{
					name: "Check For Updates",
					uniqueid: "Check For Updates",
					category: "Loading",
					img: cfu,
					localVersion: "3.0",
					service: "RoutineHub",
					id: 793
				},
				{
					name: "Trivia",
					uniqueid: "Trivia",
					category: "Loading",
					img: icontrivia,
					localVersion: "1.2.2",
					service: "RoutineHub",
					id: 1001
				},
				{
					name: "Unpublished Shortcut",
					uniqueid: "UnpublishedShortcut",
					category: "Loading",
					img: icontest,
					localVersion: "0",
					service: "RoutineHub",
					id: 816
				}
			]
		};
	}
	categorize(dat: ShortcutData, category: ShortcutCategory) {
		dat.category = category;
		this.setState({ data: this.state.data });
	}
	render() {
		const shortcutsByCategory: {
			[key in ShortcutCategory]?: ShortcutData[]
		} = {};
		this.state.data.forEach(shortcut => {
			if (!shortcutsByCategory[shortcut.category]) {
				shortcutsByCategory[shortcut.category] = [];
			}
			// @ts-ignore
			shortcutsByCategory[shortcut.category].push(shortcut);
		});
		return (
			<div className="content">
				{categoryOrder.map(category => {
					let scbc = shortcutsByCategory[category];
					if (scbc) {
						return (
							<div key={category}>
								<h1>{categoryNames[category]}</h1>
								{scbc.map(dat => (
									<Shortcut
										localVersion={dat.localVersion}
										img={dat.img}
										name={dat.name}
										routinehubID={dat.id}
										categorize={category =>
											this.categorize(dat, category)
										}
										key={dat.uniqueid}
									/>
								))}
							</div>
						);
					}
					return null;
				})}
			</div>
		);
	}
}
export default App;
