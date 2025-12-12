<script lang="ts">
	import { onMount } from "svelte"
	import * as site from "$data/site"
	import Bio from "$components/Bio.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import type { Person } from "$models/Person"
	import { sanitizedPassphrase } from "$helpers"

	import TextEditor from "./TextEditor.svelte"
	import PreviousHeadshotPicker from "./PreviousHeadshotPicker.svelte"
	import type { FormEventHandler } from "svelte/elements"
	import { dev } from "$app/environment"

	let { data } = $props()

	const devFormFeedback = dev && true
	const startOnFormScreen = dev && true

	const { disabled, productions: productions_, imageFiles } = data
	const productions = productions_.map((p) => p.title)

	onMount(() => {
		if (!window.fetch) dispatch(events.foundNoFetch)
	})

	const MAX_WORDS = 125
	const PLACEHOLDER_IMAGE = "/src/images/people/bill-murray.jpg"

	let lastYearBios = `/who/${site.season - 1}`

	let fields = $state({
		firstName: "",
		lastName: "",
		imageUrlEncoded: "",
		useOldHeadshot: false,
		oldImageSrcPath: "",
		location: "",
		bio: "",
		addLongerBio: false,
		longerBio: "",
		email: "",
	})

	let passphrase = $state("")
	let position = $state("")
	let imageFile: null | File = $state(null)
	let pullRequest = $state("")

	function handleUseOldHeadshotChange(e: Event) {
		const unchecked = !(e.target as HTMLInputElement).checked
		if (unchecked) {
			fields.imageUrlEncoded = ""
			imageFile = null
		}
	}

	let roles: Person["roles"] = $state([])
	let staffPositions: Person["staffPositions"] = $state([])
	let productionPositions: Person["productionPositions"] = $state([])
	let positions: Person["positions"] = $state([])

	function updateProductionJob(
		productionName: string,
		position: string,
		roles: Person["roles"] | Person["productionPositions"],
	) {
		let localRoles = JSON.parse(JSON.stringify(roles)) as typeof roles
		const updatedRole = {
			productionName,
			positions: position
				.split(",")
				.map((x) => x.trim())
				.filter(Boolean),
		}

		const existing = localRoles.findIndex(
			(r) => r.productionName === productionName,
		)

		if (existing > -1) {
			localRoles = localRoles
				// replace the old production only
				.map((r, i) => (i === existing ? updatedRole : r))
				// Remove the production if they clear the field
				.filter((r) => r.positions.length)
		} else {
			localRoles = [...localRoles, updatedRole].sort(
				(a, b) =>
					productions.findIndex((show) => show === a.productionName) -
					productions.findIndex((show) => show === b.productionName),
			)
		}

		return localRoles
	}

	function mutateRoles(
		productionName: string,
		position: Person["positions"][0],
	) {
		roles = updateProductionJob(productionName, position, roles)
	}

	function mutateProductionPositions(
		productionName: string,
		position: Person["positions"][0],
	) {
		productionPositions = updateProductionJob(
			productionName,
			position,
			productionPositions,
		)
	}

	function mutateStaffPositions(positions: string) {
		staffPositions = positions
			.split(",")
			.map((x) => x.trim())
			.filter(Boolean)
	}

	let name = $derived(
		fields.firstName ? `${fields.firstName} ${fields.lastName}` : "",
	)

	let exampleBio = $derived({
		name: name || "Bill Murray",
		image: fields.useOldHeadshot
			? fields.oldImageSrcPath
			: fields.imageUrlEncoded || PLACEHOLDER_IMAGE,
		location: fields.location || "Chicago, IL",
		roles,
		staffPositions,
		productionPositions,
		positions,
		bio:
			fields.bio ||
			`Bill is thrilled (everyone says thrilled) to be making his Post Playhouse debut! Previous credits include _Ghostbusters_, _Groundhog Day_, and many more.`,
		longerBio: fields.addLongerBio ? fields.longerBio : "",
	})

	let wordCount = (s: string) =>
		s
			.replace(/[_*]\w+\s+.*?[_*]/g, "SHOW TITLE")
			.replace(/[_*].*?[_*]/g, "SHOW")
			.split(/\s+/)
			.filter(Boolean).length

	let bioWordCount = $derived(wordCount(fields.bio))
	let bioWordCountClass = $derived.by(function () {
		if (bioWordCount > MAX_WORDS) {
			return "text-red-500"
		}
		if (bioWordCount > MAX_WORDS - 5) {
			return "text-orange-500"
		}
		return "text-black"
	})

	let longerBioWordCount = $derived(wordCount(fields.longerBio))
	let longerBioWordCountClass = $derived.by(function () {
		if (longerBioWordCount <= MAX_WORDS) {
			return "text-red-500"
		}
		return "text-black"
	})

	let validations = $derived([
		{
			name: "noShowsPresent",
			warn:
				fields.bio.length > 0 &&
				(fields.bio.match(/_/g) || []).length === 0 &&
				(fields.bio.match(/\*/g) || []).length === 0,
		},
		{
			name: "noShowsPresentLongerBio",
			warn:
				fields.addLongerBio &&
				longerBioWordCount > MAX_WORDS &&
				(fields.longerBio.match(/_/g) || []).length === 0 &&
				(fields.longerBio.match(/\*/g) || []).length === 0,
		},
		{ name: "wordCount", invalid: bioWordCount > MAX_WORDS },
		{ name: "firstName", invalid: !fields.firstName },
		{ name: "location", invalid: !fields.location },
		{ name: "emptyBio", invalid: !fields.bio },
		{ name: "email", invalid: !fields.email },
		{ name: "image", invalid: !(imageFile || fields.useOldHeadshot) },
		{
			name: "oldImage",
			invalid: fields.useOldHeadshot && !fields.oldImageSrcPath,
		},
		{
			name: "longerBioIsShort",
			invalid: fields.addLongerBio && longerBioWordCount <= MAX_WORDS,
		},
	] satisfies Array<
		| { name: keyof typeof validationMessages; invalid: boolean }
		| { name: keyof typeof warningMessages; warn: boolean }
	>)

	const validationMessages = {
		firstName: "You must supply a first name.",
		location:
			"You must supply a location. That's like where you'd like people to know you are from.",
		wordCount: `Your bio is too long. Keep it at or under ${MAX_WORDS} words.`,
		emptyBio: "You must supply some kind of bio.",
		email:
			"Please add your email address so that our program designer can get in touch quickly if needs be.",
		image:
			"Use the green button near the top of the form to pick an image, or indicate you'd like to use one from a previous season.",
		oldImage:
			"You indicated that you wanted to use an old headshot, but you didn't select one.",
		longerBioIsShort: `If your longer bio for the website is ${MAX_WORDS} or less, please don't submit two bios. (Uncheck the additional bio box)`,
	}

	const warningMessages = {
		noShowsPresent:
			"<strong>It looks like your bio doesn't include the titles of any productions</strong> you've been involved with. That's fine. But if you did include production titles, you forgot to <em>italicize them</em>.",
		noShowsPresentLongerBio:
			"It looks like <strong>your longer bio for the website doesn't include the titles of any productions</strong> you've been involved with. That's fine. But if you did include production titles, you forgot to <em>italicize them</em>.",
	}

	let invalidForm = $derived(validations.some((v) => v.invalid === true))

	$effect(() => {
		if (invalidForm) dispatch(events.invalidatedForm)
		if (!invalidForm) dispatch(events.validatedForm)
	})

	const states = {
		submissionsDisabled: "submissionsDisabled",
		unauthenticated: "unauthenticated",
		requestingAuth: "requestingAuth",
		incompleteForm: "incompleteForm",
		completeForm: "completeForm",
		sendingHeadshotBio: "sendingHeadshotBio",
		success: "success",
		error: "error",
		noFetch: "noFetch",
	}

	const events = {
		requestAuth: "requestAuth",
		getCredsFailed: "getCredsFailed",
		badPassphrase: "badPassphrase",
		confirmedPassphrase: "confirmedPassphrase",
		validatedForm: "validatedForm",
		invalidatedForm: "invalidatedForm",
		postBio: "postBio",
		sendHeadshotBioSuccess: "sendHeadshotBioSuccess",
		sendHeadshotBioFailure: "sendHeadshotBioFailure",
		foundNoFetch: "foundNoFetch",
		serverError: "serverError",
	}

	let badPassphrase = $state(false)

	let pageState = $state(
		(() => {
			let startingState = disabled
				? states.submissionsDisabled
				: states.unauthenticated

			startingState = startOnFormScreen ? states.incompleteForm : startingState

			return startingState
		})(),
	)

	let showCredsForm = $derived(
		[states.unauthenticated, states.requestingAuth].includes(pageState),
	)

	let showMain = $derived(
		[
			states.incompleteForm,
			states.completeForm,
			states.sendingHeadshotBio,
		].includes(pageState),
	)
	let submitting = $derived(
		[states.requestingAuth, states.sendingHeadshotBio].includes(pageState),
	)
	let finalSubmission = $derived(pageState === states.sendingHeadshotBio)
	let showSuccess = $derived(pageState === states.success)
	let showError = $derived(pageState === states.error)

	let topOfMainEl: HTMLElement | null = $state(null)

	$effect(() => {
		if (showMain && topOfMainEl) {
			topOfMainEl.scrollIntoView({
				behavior: "smooth",
				block: "start",
				inline: "nearest",
			})
		}
	})

	function dispatch(event: string) {
		if (event === events.foundNoFetch) {
			return (pageState = states.noFetch)
		}

		if (event === events.serverError) {
			return (pageState = states.error)
		}

		switch (pageState) {
			case states.submissionsDisabled: {
				// You can checkout any time you like, but you can never leave
				return
			}
			case states.unauthenticated: {
				switch (event) {
					case events.requestAuth:
						confirmPassphrase()
						return (pageState = states.requestingAuth)
					default:
						return
				}
			}
			case states.requestingAuth: {
				switch (event) {
					case events.confirmedPassphrase: {
						return (pageState = states.incompleteForm)
					}
					case events.badPassphrase: {
						badPassphrase = true
						return (pageState = states.unauthenticated)
					}
					case events.getCredsFailed: {
						return (pageState = states.error)
					}
					default:
						return
				}
			}
			case states.incompleteForm: {
				switch (event) {
					case events.validatedForm:
						return (pageState = states.completeForm)
					default:
						return
				}
			}
			case states.completeForm: {
				switch (event) {
					case events.invalidatedForm:
						return (pageState = states.incompleteForm)
					case events.postBio:
						handleSubmit()
						return (pageState = states.sendingHeadshotBio)
					default:
						return
				}
			}
			case states.sendingHeadshotBio: {
				switch (event) {
					case events.sendHeadshotBioFailure: {
						return (pageState = states.error)
					}
					case events.sendHeadshotBioSuccess: {
						handleNotify()
						return (pageState = states.success)
					}
					default:
						return
				}
			}
			case states.success: {
				switch (event) {
					default:
						return
				}
			}
			case states.error: {
				switch (event) {
					default:
						return
				}
			}
		}
	}

	function handleFilePick(
		e: Parameters<FormEventHandler<HTMLInputElement>>[0],
	) {
		const pickedFile = e.currentTarget.files?.[0]
		if (!pickedFile || !pickedFile.type.match("image.*"))
			return (fields.imageUrlEncoded = PLACEHOLDER_IMAGE)

		var reader = new FileReader()

		reader.onload = function (evt) {
			fields.imageUrlEncoded = evt.target?.result as string
			imageFile = pickedFile
		}

		reader.readAsDataURL(pickedFile)
	}

	async function confirmPassphrase() {
		const res = await window.fetch("/api/bio-submission/confirm-passphrase", {
			method: "GET",
			headers: new Headers({
				Authorization: sanitizedPassphrase(passphrase),
			}),
		})
		if (res.ok) {
			position = (await res.json()).position as string
			dispatch(events.confirmedPassphrase)
		} else if (res.status === 403) {
			dispatch(events.badPassphrase)
		} else {
			dispatch(events.serverError)
		}
	}

	type Creds = { authorizationToken: string; uploadUrl: string }

	/**
	 * The count will determine how many sets of creds are returned in the array
	 * (we need one set per file to upload)
	 */
	async function getCreds<T extends number>(
		count: T,
	): Promise<ConstructTuple<T, Creds>> {
		const resp = await window.fetch(
			`/api/bio-submission/upload-url?count=${count}`,
			{
				method: "GET",
				headers: new Headers({
					Authorization: sanitizedPassphrase(passphrase),
				}),
			},
		)
		if (resp.ok) return resp.json()
		else throw new Error("could not get creds")
	}

	const safeName = (str: string) =>
		str
			.trim()
			.toLowerCase()
			.replace(/[^a-z]+/gi, "-")

	const submitBio = () => dispatch(events.postBio)

	function getYamlBody({
		includeEmptyProductions: fillRoles,
	}: { includeEmptyProductions?: boolean } = {}) {
		let localRoles: typeof roles = JSON.parse(JSON.stringify(roles))
		let localProductionPositions: typeof productionPositions = JSON.parse(
			JSON.stringify(productionPositions),
		)

		if (fillRoles) {
			productions.forEach((prod) => {
				const role = localRoles.find((r) => r.productionName === prod)
				if (!role) {
					localRoles = updateProductionJob(prod, " ", localRoles)
				}

				const position = localProductionPositions.find(
					(r) => r.productionName === prod,
				)
				if (!position) {
					localProductionPositions = updateProductionJob(
						prod,
						" ",
						localProductionPositions,
					)
				}
			})
		}

		const yamlStaffPositions = staffPositions
			.map((p) => `    - ${p.trim()}`)
			.join("\n")

		const yamlRoles = localRoles
			.map(
				(r) =>
					`    ${r.productionName}:\n${r.positions
						.map((p) => `      - ${p.trim()}`)
						.join("\n")}`,
			)
			.join("\n")

		const yamlProductionPositions = localProductionPositions
			.map(
				(r) =>
					`    ${r.productionName}:\n${r.positions
						.map((p) => `      - ${p.trim()}`)
						.join("\n")}`,
			)
			.join("\n")

		function bioTrim(text: string) {
			return text.trim().replaceAll("\n", "\n    ")
		}

		return [
			`- last_name: ${fields.lastName.trim()}`,
			`  first_name: ${fields.firstName.trim()}`,
			`  image_year: ${fields.useOldHeadshot ? fields.oldImageSrcPath.split("/")[3] : site.season}`,
			`  location: "${fields.location.trim()}"`,
			yamlStaffPositions && `  staff_positions:\n${yamlStaffPositions}`,
			yamlProductionPositions &&
				`  production_positions:\n${yamlProductionPositions}`,
			yamlRoles && `  roles:\n${yamlRoles}`,
			!fields.addLongerBio && `  bio: |\n    ${bioTrim(fields.bio)}`,
			fields.addLongerBio && `  program_bio: |\n    ${bioTrim(fields.bio)}`,
			fields.addLongerBio && `  bio: |\n    ${bioTrim(fields.longerBio)}`,
		]
			.filter(Boolean)
			.join("\n")
	}

	let emailBody =
		$derived(`Please fill/double check the form below, including copy/pasting your bio directly into this email (no attachments for bios, please). Remember that you must submit either one bio that is 125 words or less (show titles count for a maximum of two words), or two bios where one is 125 words or less for the printed program and the other is longer for the website.

Additionally, attach a headshot to this email. Thanks!

I'll email you when I have added your information to the website, so you can check that I got it right.


~Don Denton
----------------------------------------

${getYamlBody({ includeEmptyProductions: true })}
`)

	let emailLink = $derived(
		`mailto:don@postplayhouse.com?subject=${encodeURIComponent(
			`Bio Submission: ${name || "YOUR NAME"}`,
		)}&body=${encodeURIComponent(emailBody)}`,
	)

	function uploadText(payload: string, basename: string, creds: Creds) {
		return window.fetch(creds.uploadUrl, {
			method: "POST",
			headers: new Headers({
				"Content-Type": "b2/x-auto",
				Authorization: creds.authorizationToken,
				"X-Bz-Content-Sha1": "do_not_verify",
				"X-Bz-File-Name": `${basename}.txt`,
				"Content-Length": payload.length + "",
			}),
			body: payload,
		})
	}

	function uploadBioToGh(
		name: string,
		email: string,
		bioYaml: string,
		imageFile?: File,
	) {
		const fd = new FormData()
		imageFile && fd.append("imageFile", imageFile)
		fd.append("bioYaml", bioYaml)
		fd.append("name", name)
		fd.append("email", email)

		return window.fetch("/api/bio-submission/bio-to-gh", {
			method: "POST",
			headers: new Headers({
				Authorization: sanitizedPassphrase(passphrase),
			}),
			body: fd,
		})
	}

	function uploadImage(imageFile: File, newFileBaseName: string, creds: Creds) {
		if (!imageFile) return Promise.reject("no image file provided")

		const { size, type, name } = imageFile
		const ext = name.slice(name.lastIndexOf(".") + 1)

		return window.fetch(creds.uploadUrl, {
			method: "POST",
			headers: new Headers({
				"Content-Type": type,
				Authorization: creds.authorizationToken,
				"X-Bz-Content-Sha1": "do_not_verify",
				"X-Bz-File-Name": `${newFileBaseName}.${ext}`,
				"Content-Length": size + "",
			}),
			body: imageFile,
		})
	}

	async function handleSubmit() {
		const basename = `${Date.now()}-${safeName(fields.firstName)}-${safeName(
			fields.lastName,
		)}`

		let ghTries = 0

		const doGhUpload = (): Promise<
			{ success: true; pullRequest: string } | { success: false }
		> =>
			uploadBioToGh(
				`${fields.firstName} ${fields.lastName}`,
				fields.email,
				getYamlBody(),
				imageFile ?? undefined,
			)
				.then(async (resp) => {
					if (resp.ok) {
						return {
							success: true,
							pullRequest: (await resp.json()).pullRequest,
						}
					} else if (ghTries < 3) {
						ghTries++
						return new Promise<ReturnType<typeof doGhUpload>>((res) => {
							setTimeout(() => res(doGhUpload()), 1000 * ghTries)
						})
					} else {
						throw new Error("Could not upload Bio to GitHub")
					}
				})
				.catch(() => ({ success: false }))

		const ghResult = await doGhUpload()

		if (ghResult.success) {
			pullRequest = ghResult.pullRequest
			dispatch(events.sendHeadshotBioSuccess)
			return
		}

		let bioTries = 0
		let headshotTries = 0

		const messageToMyself = `
bio position:     ${position}
bio words:        ${bioWordCount}
longer bio words: ${fields.addLongerBio ? longerBioWordCount : "n/a"}

${fields.email}
`

		const doBioUpload = async (): Promise<true> =>
			uploadText(
				`${getYamlBody()}\n\n\n${messageToMyself}`,
				basename,
				(await getCreds(1))[0],
			).then((resp) => {
				if (resp.ok) {
					return true
				} else if (bioTries < 3) {
					bioTries++
					return doBioUpload()
				} else {
					throw new Error("Could not upload Bio")
				}
			})

		const doHeadshotUpload = async (): Promise<true> =>
			uploadImage(imageFile as File, basename, (await getCreds(1))[0]).then(
				(resp) => {
					if (resp.ok) {
						return true
					} else if (headshotTries < 3) {
						headshotTries++
						return getCreds(1).then(doHeadshotUpload)
					} else {
						throw new Error("Could not upload Headshot")
					}
				},
			)

		const jobs = [
			doBioUpload(),
			!fields.useOldHeadshot && doHeadshotUpload(),
		].filter(Boolean)

		return Promise.all(jobs)
			.then(() => {
				dispatch(events.sendHeadshotBioSuccess)
			})
			.catch(() => dispatch(events.sendHeadshotBioFailure))
	}

	function handleNotify() {
		// This notification is icing on the cake, so it doesn't really matter if it
		// fails.
		window.fetch(`/api/bio-submission/notify`, {
			method: "POST",
			headers: new Headers({
				Authorization: sanitizedPassphrase(passphrase),
			}),
			body: JSON.stringify({
				name: `${fields.firstName} ${fields.lastName}`,
				pullRequest,
			}),
		})
	}

	const submitCreds = (e: Event) => {
		e.preventDefault()
		dispatch(events.requestAuth)
	}
</script>

<svelte:head>
	<title>Post Playhouse: Bio Submission</title>
</svelte:head>

<h2 class="h2">Bio Submission</h2>

{#if pageState === states.submissionsDisabled}
	<article>
		<header><h3 class="h3">Bio submissions are unavailable</h3></header>
		<p class="my-8">
			We will turn on bio submissions as the summer season approaches.
		</p>
	</article>
{/if}

{#if pageState === states.noFetch}
	<div class="my-4 rounded-sm bg-red-200 p-4 text-red-900">
		This submission form will not work from your device. Please send an email to
		<a class="link-green" href={emailLink}>don@postplayhouse.com</a>
	</div>
{/if}

{#if showCredsForm}
	<p class="my-4">
		Have a look at
		<a class="link-green" href={lastYearBios}>last year's bios</a>
		if you'd like some context.
	</p>

	<div class="rounded-sm bg-green-100 p-4 dark:bg-green-900">
		<p>Please have the following ready to go before you start:</p>
		<ul>
			<li>
				The <strong>passphrase</strong> contained in an email we sent you after you
				signed your contract. If you don't have it, contact us.
			</li>
			<li>
				Your <strong>headshot</strong>
				<ul>
					<li>as a JPEG (very common) or HEIF (iPhone pic format)</li>
					<li>less than 20MB in file size (it <em>probably</em> is already)</li>
				</ul>
			</li>
			<li>
				Your <strong>bio</strong>
				<ul>
					<li>
						It should be written in the third person. ("Jane is thrilled to be
						joining Post Playhouse...")
					</li>
					<li>
						It must be {MAX_WORDS} words or less. (You can optionally submit an
						<em>additional</em>, longer one as well)
					</li>
					<li>
						Use <em>italics</em> for production titles. (NOT ALL CAPS, not "Within
						Quotes")
					</li>
					<li>
						You may include links, which will be present on the website version
						of your bio.
					</li>
					<li>
						We highly recommend composing it on your phone or computer first,
						then pasting it into the form on this site.
					</li>
				</ul>
			</li>
		</ul>
	</div>

	<form class="mt-12" onsubmit={submitCreds}>
		<label class="block text-2xl">
			Done reading above?<br />Enter the passphrase to get started!

			<input
				class="block"
				bind:value={passphrase}
				name="passphrase"
				type="text"
			/>
		</label>
		{#if pageState === states.requestingAuth}
			<button class="btn btn-p mt-4" disabled>Checking...</button>
		{:else}<button class="btn btn-p mt-4">Continue</button>{/if}

		{#if badPassphrase}
			<span class="text-red-700">
				The passphrase you entered was incorrect.
			</span>
		{/if}
	</form>
{/if}

{#if showMain}
	{#if devFormFeedback}
		<div
			class="pre fixed top-0 right-0 bottom-0 z-10 w-1/4 overflow-scroll bg-blue-200 p-2 whitespace-pre-wrap dark:bg-blue-900"
		>
			{getYamlBody()}

			{JSON.stringify(fields, null, 2)}
		</div>
	{/if}
	<div bind:this={topOfMainEl} class="mt-4 mb-24 max-w-lg">
		<p class="mt-4 border border-amber-800 bg-amber-100 p-4 dark:bg-amber-800">
			If you have trouble with this form please compose an email with all the
			information we ask you for below and send it to
			<a class="underline" href={emailLink}>don@postplayhouse.com</a>
		</p>
	</div>

	<div class="mt-8 mb-24 lg:flex">
		<form
			class="m-auto max-w-lg flex-none p-2 lg:w-1/2"
			onsubmit={(e) => e.preventDefault()}
		>
			<label class="block text-2xl">
				Email address<i>*</i>
				<div class="text-sm">
					(So our program designer can contact you if necessary. It is not
					shared with the public.)
				</div>
				<input
					class="block"
					bind:value={fields.email}
					name="email"
					type="email"
				/>
			</label>

			<div class="my-32">
				<div class="block text-2xl">Headshot<i>*</i></div>
				<label class="mt-2 block">
					<input
						tabindex="0"
						type="checkbox"
						onchange={handleUseOldHeadshotChange}
						bind:checked={fields.useOldHeadshot}
					/>
					I've worked at Post before, and I'd like to use my old headshot.
				</label>
				{#if fields.useOldHeadshot}
					<div class="my-4">
						<PreviousHeadshotPicker
							options={imageFiles}
							selectedOption={fields.oldImageSrcPath}
							onOptionSelected={(x) => (fields.oldImageSrcPath = x)}
						/>
					</div>
				{:else}
					<label
						class="btn btn-p inline-block w-[9em] cursor-pointer text-center {fields.useOldHeadshot
							? 'opacity-50'
							: ''}"
					>
						{#if !imageFile}Choose a file{:else}Change file{/if}
						<input
							class="hidden"
							onchange={handleFilePick}
							name="headshot"
							accept=".jpg,.jpeg,.heif"
							type="file"
						/>
					</label>
				{/if}
				<img
					class="inline-block h-[100px] w-[100px] object-contain {fields.imageUrlEncoded &&
					!fields.useOldHeadshot
						? ''
						: 'invisible'}"
					src={fields.imageUrlEncoded}
					alt={imageFile?.name}
				/>
			</div>

			<div class="my-48">
				<label class="mt-8 block text-2xl">
					First Name<i>*</i>
					<div class="text-sm">(optionally with middle name/initial)</div>
					<input
						class="block"
						bind:value={fields.firstName}
						name="firstName"
						type="text"
					/>
				</label>
				<label class="mt-8 block text-2xl">
					Last Name<i>*</i>
					<input
						class="block"
						bind:value={fields.lastName}
						name="lastName"
						type="text"
					/>
				</label>
				<label class="mt-8 block text-2xl">
					Location<i>*</i>
					<div class="text-sm">
						(where you'd like people to know you are from. City and state, eg:
						"Crawford, NE")
					</div>
					<input
						class="block"
						bind:value={fields.location}
						name="location"
						type="text"
					/>
				</label>
			</div>

			<div class="my-48">
				<span class="mt-24 block text-2xl">Acting Roles</span>
				<div class="text-sm">
					If you are acting this season, please fill out your roles below. Leave
					any blank that do not apply. Use commas to separate multiple roles.
				</div>
				<div class="mt-1 text-sm">
					Examples: <br />
					<code
						class="rounded-sm bg-gray-300 px-1 py-px text-xs dark:bg-green-300/50"
						>Franz, Ensemble</code
					>
				</div>
				{#each productions as production}
					<label class="mt-4 block text-xl">
						{production}
						<input
							class="block"
							type="text"
							oninput={(e) => {
								mutateRoles(production, e.currentTarget.value)
							}}
						/>
					</label>
				{/each}
			</div>

			<div class="my-48">
				<span class="mt-24 block text-2xl"
					>Production Positions (non-acting)</span
				>
				<div class="text-sm">
					Please fill out what you are doing for each production aside from
					acting. Leave any blank that do not apply and use the Entire Season
					field for anything that isn't specific to a given show (Stitcher, Box
					Office Staff, etc.). Use commas to separate multiple positions/roles.
				</div>
				<label class="mt-4 mb-12 block text-xl">
					Entire Season
					<div class="mt-1 text-sm">
						Examples:<br />
						<code
							class="rounded-sm bg-gray-300 px-1 py-px text-xs dark:bg-green-300/50"
							>Box Office Staff</code
						><br />
						<code
							class="rounded-sm bg-gray-300 px-1 py-px text-xs dark:bg-green-300/50"
							>Season Sound Engineer</code
						>
					</div>
					<input
						class="block"
						type="text"
						oninput={(e) => mutateStaffPositions(e.currentTarget.value)}
					/>
				</label>
				<div class="mt-4 block text-xl">
					Specific Productions
					<div class="mt-1 text-sm">
						Examples: <br />
						<code
							class="rounded-sm bg-gray-300 px-1 py-px text-xs dark:bg-green-300/50"
							>Assistant Stage Manager</code
						><br />
						<code
							class="rounded-sm bg-gray-300 px-1 py-px text-xs dark:bg-green-300/50"
							>Director, Choreographer</code
						><br />
						<code
							class="rounded-sm bg-gray-300 px-1 py-px text-xs dark:bg-green-300/50"
							>Music Director, Keys 1</code
						>
					</div>
				</div>
				{#each productions as production, i}
					<label class="mt-4 block text-xl {i === 0 ? 'mt-12' : ''}">
						{production}

						<input
							class="block"
							type="text"
							oninput={(e) =>
								mutateProductionPositions(production, e.currentTarget.value)}
						/>
					</label>
				{/each}
			</div>

			<label for="bio" class="mt-24 block text-2xl"
				>Program {#if !fields.addLongerBio}and Website{/if} Bio<i>*</i></label
			>
			<p class="my-2">
				Please italicize production titles. Feel free to add links which will
				appear in the website version.
			</p>
			<TextEditor content={fields.bio} onChange={(x) => (fields.bio = x)} />
			<div class={`text-right ${bioWordCountClass}`}>
				Word Count:
				{bioWordCount}
				out of a max of
				{MAX_WORDS}
			</div>

			<label class="my-2 block">
				<input
					tabindex="0"
					type="checkbox"
					bind:checked={fields.addLongerBio}
				/>
				<span class="text-sm">
					I'd like to submit an additional bio longer than {MAX_WORDS} words for
					the website. I understand that
					<strong>either bio may be used for the printed program</strong>, but
					it will be at the sole discretion of the person laying out the
					program.
				</span>
			</label>

			{#if fields.addLongerBio}
				<div>
					<label for="longerBio" class="mt-8 block text-2xl">Website Bio</label>
					<TextEditor
						content={fields.longerBio}
						onChange={(x) => (fields.longerBio = x)}
					/>
					<div class={`text-right ${longerBioWordCountClass}`}>
						Word Count:
						{longerBioWordCount} (must be <em>more than</em> 125 words, otherwise
						only submit one bio please)
					</div>
				</div>
			{/if}
		</form>

		<div>
			<div class="sticky top-0 bg-gray-200 p-4 dark:bg-green-200/20">
				<h3>Preview (your answers change this preview):</h3>
				<div class="rounded-sm bg-white p-4 shadow-lg dark:bg-black">
					<Bio person={exampleBio} />
				</div>

				{#if validations.length > 0}
					<ul class="list-none p-0">
						{#each validations as validation (validation.name)}
							{#if validation.invalid}
								<li class="mt-4">
									<span class="inline-block rounded-sm bg-red-500 p-1"></span>
									{@html validationMessages[validation.name]}
								</li>
							{/if}
							{#if validation.warn}
								<li
									class="prose mt-4 rounded-sm border border-yellow-500 bg-yellow-100 p-2 dark:bg-yellow-800/30"
								>
									<header class="font-bold text-yellow-600">Warning:</header>
									<p>{@html warningMessages[validation.name]}</p>
								</li>
							{/if}
						{/each}
					</ul>
				{/if}
				<button
					type="button"
					tabindex="0"
					class="btn btn-p mt-8"
					disabled={invalidForm || submitting}
					onclick={submitBio}
				>
					{#if submitting}Submitting{:else}Submit Bio{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if finalSubmission}
	<Modal>
		Please wait and do not close your browser... it may take some time to upload
		your information...
	</Modal>
{/if}

{#if showSuccess}
	<h3 class="text-2xl">Success!</h3>
	<p>
		Thank you for submitting your bio. I will be in touch via email if anything
		is out of place. So if you see an email from don@postplayhouse.com, it is
		probably about your bio.
	</p>
{/if}

{#if showError}
	<h3 class="text-2xl">Oh no.</h3>
	<p class="mt-8">
		Looks like something is messed up. Would you mind just emailing me your
		information? My email address is
		<a href="mailto:don@postplayhouse.com">don@postplayhouse.com</a>. So sorry
		for the inconvenience. If your phone/computer will allow it, I'll try and
		fill out some of the information for you if you click this button:
	</p>

	<a href={emailLink} class="btn btn-p mt-8 inline-block">Email Don Denton</a>
{/if}

<style>
	i {
		color: red;
		font-style: normal;
	}
</style>
