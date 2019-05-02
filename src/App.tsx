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

const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

function downloadData(
	id: number,
	onProgress: (percent: number) => void
): Promise<RoutineHubShortcutData> {
	return new Promise((resolve, reject) => {
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

type ShortcutCategory =
	| "NeedUpdating"
	| "UpToDate"
	| "NeedRollback"
	| "Loading"
	| "Error";

type ShortcutProps = {
	img: string;
	name: string;
	downloadURL: string;
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
			this.setState({
				description: `Error while checking for updates: ${
					rhdata.message
				}`,
				loading: false,
				error: true
			});
			return;
		}
		this.setState({
			publishedVersion: rhdata.Version,
			description: rhdata.Notes,
			downloadURL: `https://routinehub.co/download/${rhdata.id}`,
			updateStatus: semverCompare(
				this.props.localVersion,
				rhdata.Version
			),
			loading: false
		});
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
							className="button getversion"
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
							aria-valueNow={
								+this.state.percentComplete.toFixed(2) * 100
							}
							aria-valueMin={0}
							aria-valueMax={100}
						/>
					</div>
				) : null}
			</div>
		);
	}
}

class App extends Component<{}, {}> {
	categorize(category: ShortcutCategory) {}
	render() {
		return (
			<div className="content">
				<h1>Loading...</h1>
				<h1>Need Updating</h1>
				<Shortcut
					img={img}
					name={"ALL THE GIFs!"}
					localVersion={"1.2.2"}
					downloadURL={"https://routinehub.co/download/7560"}
					routinehubID={2277}
					categorize={(category: ShortcutCategory) =>
						this.categorize(category)
					}
				/>
				<Shortcut
					img={cfu}
					name={"Check For Updates"}
					localVersion={"3.0"}
					downloadURL={"https://routinehub.co/download/7537"}
					routinehubID={793}
					categorize={(category: ShortcutCategory) =>
						this.categorize(category)
					}
				/>
				<h1>Up To Date</h1>
				<Shortcut
					img={icontrivia}
					name={"Trivia"}
					localVersion={"1.2.2"}
					downloadURL={"https://routinehub.co/download/7537"}
					routinehubID={1001}
					categorize={(category: ShortcutCategory) =>
						this.categorize(category)
					}
				/>
				<Shortcut
					img={icontest}
					name={"Secret Shortcut"}
					localVersion={"1.2.2"}
					downloadURL={"https://routinehub.co/download/7537"}
					routinehubID={816}
					categorize={(category: ShortcutCategory) =>
						this.categorize(category)
					}
				/>
			</div>
		);
	}
}
export default App;
