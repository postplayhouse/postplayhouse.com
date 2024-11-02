<script lang="ts">
	import { crossfade } from "svelte/transition"

	import { linear } from "svelte/easing"
	import { fast } from "./helpers"

	const SLOWNESS = fast ? 1 : 8

	type Props = {
		onEventDone: () => void
	}

	let { onEventDone: eventDone }: Props = $props()

	const sections = [
		{
			title: "$500+",
			names: [
				"Ken and Diana Armknecht",
				"Norberto Ayala-Flores",
				"Tom Schleff",
				"Jim & Jeanne Walter",
				"Rose Braz",
				"Kathryn and Dennis King",
				"April Neubauer",
				"Michael Varn",
				"Mobius Communications Company",
				"William C Walter",
				"Joan Laudeman",
				"William R Huntington",
				"Dr. Steve & Brenda Beliel",
				"Del Mulder",
				"Steve And Kathy Klaes",
				"Benguin Propane",
				"Lodgepole Valley Good Sam's",
				"Nancy Sayer",
				"Gardner, Loutzenhiser & Ryan PC",
				"Denise Gaffney",
				"Liz Davenport",
				"Max Merchen",
				"MCT Trucking LLC",
				"Phillips F & T Inc.",
				"Farmer's State Bank",
				"Jim Gardner",
				"Sandra Haas",
				"Troy Unzicker",
				"Gladys J. Soester Revocable Trust",
				"Dave's Pharmacy",
				"Patrick McMahon",
				"Anonymous (2)",
			],
		},
		{
			title: "$250+",
			names: [
				"J.D. Ashley",
				"Steven Beliel",
				"Gary Blundell",
				"Marla Bouton",
				"Buchheit Precision",
				"Chapter BZ P.E.O.",
				"Susan Carrier",
				"Gary Coleman",
				"Delsing Farms",
				"Donna McEowen",
				"Eagle Communications",
				"Elite AG Partners",
				"Jim Ernst",
				"Jim Erwin",
				"Farmer's Cooperative Elevator Co.",
				"First National Bank of Gordon",
				"Pam Forbord",
				"Hemingford Chamber of Commerce",
				"Doris R. Jacobsen",
				"JAV Enterprises",
				"Jerry Kallhoff",
				"Barb Kendle",
				"Steve Klaes",
				"Glen Kotschwar",
				"TJ Moore",
				"James Murphy",
				"Tom Ossowski",
				"Glenn Price",
				"Kim Reichert",
				"Steve Remmert",
				"Linda Roos",
				"Danny & Judy Sample",
				"Wally Seiler",
				"Marlin Sekutera",
				"Table Top Meats Inc.",
				"Terrance Terrell",
				"Charlotte Vaughan",
				"Jim Weinman",
				"Rebecca Wiegand",
				"Janice (Sue) Williams",
				"Rob Youngerman",
				"Anonymous",
			],
		},
		{
			title: "$100+",
			names: [
				"Jeff Abegglen",
				"Michael Albano",
				"Bev and Les Anway",
				"Rod & Stacy Baillie",
				"Gordon Bair",
				"David And Laura Batchelor",
				"Linda Baumgartner",
				"Shelley Beguin",
				"Jerry Belford",
				"Brenda Beliel",
				"Mark Berge",
				"Linda K Blinde",
				"James Bowers",
				"Dale Bowman",
				"Norman Braz",
				"Kris Brice",
				"Maynard Britain",
				"Julia Buchheit",
				"Chadron Federal Credit Union",
				"Mary Jo and Cory Chandler",
				"Chamberlain Chapel",
				"Tod Clark",
				"Charles Coufal",
				"Crawford Livestock Market LLC",
				"Armelle Crouzieres",
				"Roger Davies",
				"Robert Delsing",
				"Sue and David Driggers",
				"Bruce Engel",
				"Farmers Coop Elevator Company",
				"Beth & Bruce Forney",
				"Robin Foulk",
				"Bryan Frank",
				"Jackie Gregory",
				"Lisa L. Haas",
				"Beverly Hanks",
				"Emily Hansen",
				"Kyli Heiting",
				"Richard Herboldsheimer",
				"Heritage Seed Co., Inc.",
				"Herren Bros. True Value",
				"Randall A Jamison",
				"Joni & Donald Jespersen",
				"Randy Kane",
				"Pam Kautz",
				"James F. Keegan",
				"Clicks by Kim",
				"Jane Krause",
				"Ernest Krenk",
				"John Lamberton",
				"Travis and Mandy Lambert",
				"Em Laudeman Ezell",
				"Lee Farming & Harvesting Inc.",
				"Ellen & Charles Lierk",
				"Jean A. Lovell",
				"Conrad Marshall",
				"Tonya Mayer",
				"Linda McElroy",
				"Tory McVicker",
				"Max G. Merchen",
				"Jim Miller",
				"Vicki Milner",
				"Tim Milner",
				"Jeanine Mohr",
				"Thomas and Mary Jo Moore",
				"Roger Neil",
				"Pam Perry",
				"Bradley Petersen",
				"Pine Needle Quilts LLC",
				"Lynn Poppen",
				"Richard D Pyle",
				"Mary Kay Quinlan",
				"Michael Ranney",
				"Nadean Rhoads",
				"Andrea Rising",
				"Vern & Sharon Ritzman",
				"Scott Roberts Electric",
				"Annemieke Rossini",
				"Sue Coffee Rusie",
				"Lauri Sawyer",
				"Nancy Scherbarth",
				"N David Schmidt",
				"Maurice Schmidt",
				"Janelle Schochenmaier",
				"Sandra Scofield",
				"Marlin and Joyce Sekutera",
				"Douglas Shaver",
				"Matt Silva",
				"Russel Steiner",
				"Ann Sundberg",
				"Jim Tangney",
				"Karl Tegtmeyer",
				"Linda Thayer",
				"Rebecca Thompson",
				"Marvin Toedtli",
				"Ted Vastine",
				"Albion Visser",
				"Marie Wohlers",
				"Dee Wood",
				"Robert Delsing",
				"Anonymous (5)",
			],
		},
		{
			title: "$1–99",
			names: [
				"Janet Allen",
				"Vince M Bartlett",
				"S S Batty",
				"Dean Bohn",
				"Rose Burrows",
				"Michael Cameron",
				"Gwenda Canet",
				"Jerry Cassiday",
				"Titus Coop",
				"Lynda Denton",
				"Trayce Dinkel",
				"Ellen Dornemann",
				"Jill Ellis",
				"JoAnn Emerson",
				"Dara Edwards",
				"Michaela Gasseling",
				"Mike Gering",
				"Leslie Green",
				"Marilyn Halse",
				"Barbara J. Hardy",
				"Jason Hawk",
				"Conan Heelan",
				"Bruce Hitchcock",
				"Joe Jacquot",
				"Terry Jones",
				"Lynette F. Kautz",
				"Cheri Koenig",
				"Linda Maurer",
				"Jenn Maurer",
				"Michael Mittlestadt",
				"Jennifer Nixon",
				"North Side SWPBIS",
				"Claudia Olafson",
				"Jarrett Owens",
				"Jill Paopao",
				"Tony Perlinski",
				"Tabi Prochazka",
				"Cindy Randall",
				"John Randall",
				"Cheri Reese",
				"Glenn Reynolds",
				"Ted Rudberg",
				"Bernice L. Russell",
				"Sheila Schmeits",
				"Donna Schoenbeck",
				"Joel Schwartzkopf",
				"Scottsbluff Star-Herald",
				"Wally Seiler",
				"Lynn Sherry",
				"Eleanor Shimek",
				"Michael Solum",
				"Craig & Teresa Srajer",
				"Ann Stephens",
				"Denise Stone",
				"Peter and Janice Swedberg",
				"John Trapp",
				"Louise Vance",
				"Michael Wellnitz",
				"Edward Williams",
				"David Yanoski",
				"Lora Young",
				"Michael Zahn",
				"Robert Zanger",
				"Anonymous (3)",
			],
		},
	]

	const slides = $state(sections.map((x) => ({ ...x, position: "bottom" })))

	let current = $state(0)

	function getNextIndex() {
		return (current + 1) % sections.length
	}

	function nextOrDone() {
		const nextIndex = getNextIndex()
		if (nextIndex > 0) {
			const oldIndex = current
			current = nextIndex
			setTimeout(() => (slides[nextIndex]!.position = "top"), 10)
			setTimeout(() => (slides[oldIndex]!.position = "bottom"), 10)
		} else {
			eventDone()
		}
	}

	setTimeout(() => (slides[current]!.position = "top"), 10)

	const [send, receive] = crossfade({
		duration: (d) => d * SLOWNESS,
		easing: linear,

		fallback() {
			return {
				duration: 0,
				easing: linear,
			}
		},
	})
</script>

{#each slides as slide, i}
	{#if i === current}
		<article class="absolute inset-0 flex flex-col">
			<header
				class="bg-green-700 text-center font-uber text-white [font-size:5vw]"
			>
				Annual Fund Donations
				<div class="bg-green-100 text-black dark:bg-green-900 dark:text-white">
					{slide.title}
				</div>
			</header>

			<div class="relative grow">
				<div
					class="absolute inset-0 overflow-hidden text-center font-bold [font-size:5vw]"
				>
					<div class="absolute left-0 right-0 [bottom:100vh]">
						{#if slide.position === "top"}
							<div
								in:receive="{{ key: slide.title }}"
								out:send="{{ key: slide.title }}"
								onintroend="{nextOrDone}"
							>
								{#each slide.names as name}
									<div>{name}</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="absolute left-0 right-0 [top:80vh]">
						{#if slide.position === "bottom"}
							<div
								in:receive="{{ key: slide.title }}"
								out:send="{{ key: slide.title }}"
							>
								{#each slide.names as name}
									<div>{name}</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</article>
	{/if}
{/each}
