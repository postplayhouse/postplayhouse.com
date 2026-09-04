<script lang="ts">
	import { tick } from "svelte"
	import Bio from "$components/Bio.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import { sanitizedPassphrase } from "$helpers"

	type PendingBio = {
		position: number
		firstName: string
		lastName: string
		location: string
		email: string
		bio: string
		programBio?: string
		staffPositions?: string[]
		productionPositions?: Record<string, string[]>
		roles?: Record<string, string[]>
		originalImageUrl: string
		imageYear: number
		submittedAt: string
	}

	type PurgeResult = {
		success: boolean
		simulated: boolean
		purge: { tag: string; success: boolean; status: number | string | null }
		warming: Array<{
			url: string
			success: boolean
			status: number | string | null
		}>
	}

	type PageState =
		| "unauthenticated"
		| "authenticating"
		| "authenticated"
		| "error"
	type CardAction = "approve" | "reject"

	let passphrase = $state("")
	let authorization = $state("")
	let pageState: PageState = $state("unauthenticated")
	let bios: PendingBio[] = $state([])
	let pageMessage = $state("")
	let actionByPosition: Record<number, CardAction | undefined> = $state({})
	let actionMessages: Record<number, string | undefined> = $state({})
	let rejectionBio: PendingBio | undefined = $state()
	let rejectionReason = $state("")
	let rejectionButton: HTMLButtonElement | undefined
	let rejectionHeading: HTMLHeadingElement | undefined = $state()
	let purgePending = $state(false)
	let purgeResult: PurgeResult | undefined = $state()
	let purgeMessage = $state("")

	function responseMessage(body: unknown, fallback: string) {
		if (
			typeof body === "object" &&
			body !== null &&
			"message" in body &&
			typeof body.message === "string"
		)
			return body.message
		return fallback
	}

	async function responseBody(response: Response): Promise<unknown> {
		try {
			return await response.json()
		} catch {
			return undefined
		}
	}

	function authHeaders(json = false) {
		const headers = new Headers({ Authorization: authorization })
		if (json) headers.set("Content-Type", "application/json")
		return headers
	}

	async function authenticate(event: SubmitEvent) {
		event.preventDefault()
		pageState = "authenticating"
		pageMessage = ""
		authorization = sanitizedPassphrase(passphrase)

		try {
			const response = await fetch("/api/admin/bios", {
				headers: authHeaders(),
			})
			const body = await responseBody(response)
			if (!response.ok) {
				pageMessage = responseMessage(body, "Unable to load pending bios.")
				pageState = "error"
				return
			}

			bios = (body as { bios: PendingBio[] }).bios.toSorted(
				(a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt),
			)
			pageState = "authenticated"
			pageMessage = `${bios.length} pending ${bios.length === 1 ? "bio" : "bios"} loaded.`
		} catch {
			pageMessage =
				"Unable to load pending bios. Check your connection and try again."
			pageState = "error"
		}
	}

	function previewPerson(bio: PendingBio) {
		const entries = (positions?: Record<string, string[]>) =>
			Object.entries(positions ?? {}).map(([productionName, values]) => ({
				productionName,
				positions: values,
			}))

		return {
			name: `${bio.firstName} ${bio.lastName}`.trim(),
			image: imageUrl(bio),
			location: bio.location,
			positions: [],
			staffPositions: bio.staffPositions ?? [],
			productionPositions: entries(bio.productionPositions),
			roles: entries(bio.roles),
			bio: bio.bio,
		}
	}

	function imageUrl(bio: PendingBio) {
		const query = new URLSearchParams({
			path: bio.originalImageUrl,
			auth: authorization,
		})
		return `/api/admin/bios/image?${query}`
	}

	function removeBio(position: number) {
		bios = bios.filter((bio) => bio.position !== position)
	}

	async function approve(bio: PendingBio) {
		actionByPosition[bio.position] = "approve"
		actionMessages[bio.position] = undefined
		try {
			const response = await fetch("/api/admin/bios/approve", {
				method: "POST",
				headers: authHeaders(true),
				body: JSON.stringify({ position: bio.position }),
			})
			const body = await responseBody(response)
			if (!response.ok) {
				actionMessages[bio.position] = responseMessage(
					body,
					`Unable to approve ${bio.firstName} ${bio.lastName}.`,
				)
				return
			}
			removeBio(bio.position)
			pageMessage = `${bio.firstName} ${bio.lastName} approved.`
		} catch {
			actionMessages[bio.position] =
				`Unable to approve ${bio.firstName} ${bio.lastName}. Check your connection and try again.`
		} finally {
			actionByPosition[bio.position] = undefined
		}
	}

	async function openRejection(bio: PendingBio, button: HTMLButtonElement) {
		rejectionBio = bio
		rejectionReason = ""
		rejectionButton = button
		await tick()
		rejectionHeading?.focus()
	}

	async function closeRejection(returnFocus = true) {
		rejectionBio = undefined
		await tick()
		if (returnFocus) rejectionButton?.focus()
	}

	function handleModalKeydown(event: KeyboardEvent) {
		if (
			event.key === "Escape" &&
			rejectionBio &&
			!actionByPosition[rejectionBio.position]
		) {
			void closeRejection()
		}
	}

	async function reject(event: SubmitEvent) {
		event.preventDefault()
		if (!rejectionBio) return

		const bio = rejectionBio
		actionByPosition[bio.position] = "reject"
		actionMessages[bio.position] = undefined
		const reason = rejectionReason.trim()

		try {
			const response = await fetch("/api/admin/bios/reject", {
				method: "POST",
				headers: authHeaders(true),
				body: JSON.stringify({
					position: bio.position,
					...(reason ? { reason } : {}),
				}),
			})
			const body = await responseBody(response)
			if (response.ok || response.status === 502) {
				removeBio(bio.position)
				await closeRejection(false)
				pageMessage = response.ok
					? `${bio.firstName} ${bio.lastName} rejected and Basecamp notified.`
					: `${bio.firstName} ${bio.lastName} was permanently rejected, but the Basecamp notification failed.`
				return
			}

			actionMessages[bio.position] = responseMessage(
				body,
				`Unable to reject ${bio.firstName} ${bio.lastName}.`,
			)
		} catch {
			actionMessages[bio.position] =
				`Unable to reject ${bio.firstName} ${bio.lastName}. Check your connection and try again.`
		} finally {
			actionByPosition[bio.position] = undefined
		}
	}

	async function purgeCache() {
		purgePending = true
		purgeResult = undefined
		purgeMessage = ""
		try {
			const response = await fetch("/api/admin/bios/purge-cache", {
				method: "POST",
				headers: authHeaders(),
			})
			const body = await responseBody(response)
			if (
				typeof body === "object" &&
				body !== null &&
				"purge" in body &&
				"warming" in body
			) {
				purgeResult = body as PurgeResult
			} else {
				purgeMessage = responseMessage(
					body,
					"Unable to purge and warm bio caches.",
				)
			}
		} catch {
			purgeMessage =
				"Unable to purge and warm bio caches. Check your connection and try again."
		} finally {
			purgePending = false
		}
	}
</script>

<svelte:head><title>Bio approvals | Post Playhouse</title></svelte:head>
<svelte:window onkeydown={handleModalKeydown} />

<main class="mx-auto max-w-6xl px-4 py-10">
	<h1 class="h1 mb-4">Bio approvals</h1>

	{#if pageState === "unauthenticated" || pageState === "authenticating" || pageState === "error"}
		<section
			class="mx-auto max-w-lg rounded-sm border border-gray-300 p-6 dark:border-gray-700"
		>
			<h2 class="h2 mb-3">Admin access</h2>
			<p class="mb-4">Enter an admin passphrase to review pending bios.</p>
			<form onsubmit={authenticate}>
				<label class="block font-bold" for="admin-passphrase">Passphrase</label>
				<input
					class="mt-1 block w-full border border-gray-500 bg-white px-3 py-2 text-black"
					id="admin-passphrase"
					name="passphrase"
					type="password"
					autocomplete="current-password"
					required
					bind:value={passphrase}
				/>
				<button
					class="btn btn-p mt-4"
					disabled={pageState === "authenticating"}
				>
					{pageState === "authenticating"
						? "Authenticating…"
						: "Load pending bios"}
				</button>
			</form>
			{#if pageState === "error"}
				<p class="mt-4 text-red-700 dark:text-red-300" role="alert">
					{pageMessage}
				</p>
			{/if}
		</section>
	{:else}
		<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<p class="text-lg font-bold">
				{bios.length} pending {bios.length === 1 ? "bio" : "bios"}
			</p>
			<button class="btn btn-p" onclick={purgeCache} disabled={purgePending}>
				{purgePending ? "Purging and warming…" : "Done Approving"}
			</button>
		</div>

		<p
			class="mb-6 rounded-sm border border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
			role="status"
			aria-live="polite"
		>
			{pageMessage}
		</p>

		{#if purgeMessage}
			<p
				class="mb-6 border border-red-700 bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200"
				role="alert"
			>
				{purgeMessage}
			</p>
		{/if}

		{#if purgeResult}
			<section
				class="mb-8 border p-4 {purgeResult.success
					? 'border-green-700 bg-green-50 dark:bg-green-950'
					: 'border-red-700 bg-red-50 dark:bg-red-950'}"
				aria-live="polite"
			>
				<h2 class="h3">
					{purgeResult.success
						? "Cache update complete"
						: "Cache update incomplete"}
					{purgeResult.simulated ? " (simulated)" : ""}
				</h2>
				<p>
					Purge tag “{purgeResult.purge.tag}”:
					<strong>{purgeResult.purge.success ? "succeeded" : "failed"}</strong>
					(status: {purgeResult.purge.status ?? "unavailable"})
				</p>
				<h3 class="mt-3 font-bold">Cache warming</h3>
				<ul class="list-disc pl-6">
					{#each purgeResult.warming as result}
						<li>
							<code>{result.url}</code>: {result.success
								? "succeeded"
								: "failed"}
							(status: {result.status ?? "unavailable"})
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if bios.length === 0}
			<p
				class="rounded-sm border border-gray-300 p-8 text-center text-xl dark:border-gray-700"
			>
				There are no pending bios.
			</p>
		{:else}
			<div class="grid gap-8">
				{#each bios as bio (bio.position)}
					<article
						class="rounded-sm border border-gray-300 p-4 shadow-sm sm:p-6 dark:border-gray-700"
					>
						<header
							class="mb-5 border-b border-gray-300 pb-4 dark:border-gray-700"
						>
							<h2 class="h2">{bio.firstName} {bio.lastName}</h2>
							<dl class="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
								<div>
									<dt class="inline font-bold">Position:</dt>
									<dd class="inline">{bio.position}</dd>
								</div>
								<div>
									<dt class="inline font-bold">Submitted:</dt>
									<dd class="inline">
										<time datetime={bio.submittedAt}
											>{new Date(bio.submittedAt).toLocaleString()}</time
										>
									</dd>
								</div>
								<div>
									<dt class="inline font-bold">Email:</dt>
									<dd class="inline">
										<a class="link-green" href={`mailto:${bio.email}`}
											>{bio.email}</a
										>
									</dd>
								</div>
								<div>
									<dt class="inline font-bold">Image year:</dt>
									<dd class="inline">{bio.imageYear}</dd>
								</div>
								<div class="sm:col-span-2">
									<dt class="inline font-bold">Original image:</dt>
									<dd class="inline break-all">
										<code>{bio.originalImageUrl}</code>
									</dd>
								</div>
							</dl>
						</header>

						<section
							aria-label={`Website bio preview for ${bio.firstName} ${bio.lastName}`}
						>
							<h3 class="h3 mb-4">Website bio preview</h3>
							<Bio person={previewPerson(bio)} />
						</section>

						{#if bio.programBio}
							<section class="mb-5 rounded-sm bg-gray-100 p-4 dark:bg-gray-900">
								<h3 class="h3 mb-2">Program bio</h3>
								<p class="whitespace-pre-wrap">{bio.programBio}</p>
							</section>
						{/if}

						<div class="mb-5 grid gap-3 sm:grid-cols-3">
							<div>
								<h3 class="font-bold">Staff positions</h3>
								<p>{bio.staffPositions?.join(", ") || "None"}</p>
							</div>
							<div>
								<h3 class="font-bold">Production positions</h3>
								<p>
									{Object.entries(bio.productionPositions ?? {})
										.map(
											([production, positions]) =>
												`${production}: ${positions.join(", ")}`,
										)
										.join("; ") || "None"}
								</p>
							</div>
							<div>
								<h3 class="font-bold">Roles</h3>
								<p>
									{Object.entries(bio.roles ?? {})
										.map(
											([production, roles]) =>
												`${production}: ${roles.join(", ")}`,
										)
										.join("; ") || "None"}
								</p>
							</div>
						</div>

						<div class="flex flex-wrap gap-3">
							<button
								class="btn btn-p"
								onclick={() => approve(bio)}
								disabled={Boolean(actionByPosition[bio.position])}
							>
								{actionByPosition[bio.position] === "approve"
									? "Approving…"
									: "Approve"}
							</button>
							<button
								class="rounded-xs border-0 border-b-2 border-solid border-red-900 bg-red-700 px-4 py-2 font-bold tracking-wide text-white hover:bg-red-600 disabled:opacity-40"
								onclick={(event) => openRejection(bio, event.currentTarget)}
								disabled={Boolean(actionByPosition[bio.position])}
								>Reject</button
							>
						</div>
						{#if actionMessages[bio.position]}
							<p class="mt-3 text-red-700 dark:text-red-300" role="alert">
								{actionMessages[bio.position]}
							</p>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</main>

{#if rejectionBio}
	<Modal
		onClose={() =>
			actionByPosition[rejectionBio!.position] ? undefined : closeRejection()}
	>
		<div role="dialog" aria-modal="true" aria-labelledby="reject-title">
			<h2
				class="h2 pr-16"
				id="reject-title"
				tabindex="-1"
				bind:this={rejectionHeading}
			>
				Reject {rejectionBio.firstName}
				{rejectionBio.lastName}’s bio?
			</h2>
			<p class="mt-4 font-bold text-red-700 dark:text-red-300">
				This permanently deletes the pending submission and cannot be undone.
			</p>
			<p class="mt-3">
				A notice identifying the submission and the optional reason will be sent
				to the admin Basecamp chat. Discussion about the rejection belongs in
				Basecamp.
			</p>
			<form class="mt-5" onsubmit={reject}>
				<label class="block font-bold" for="rejection-reason"
					>Reason (optional)</label
				>
				<textarea
					class="mt-1 block min-h-28 w-full border border-gray-500 bg-white px-3 py-2 text-black"
					id="rejection-reason"
					bind:value={rejectionReason}
				></textarea>
				<div class="mt-5 flex flex-wrap gap-3">
					<button
						class="rounded-xs border-0 border-b-2 border-solid border-red-900 bg-red-700 px-4 py-2 font-bold tracking-wide text-white hover:bg-red-600 disabled:opacity-40"
						disabled={actionByPosition[rejectionBio.position] === "reject"}
					>
						{actionByPosition[rejectionBio.position] === "reject"
							? "Rejecting…"
							: "Permanently reject"}
					</button>
					<button
						class="btn btn-p"
						type="button"
						onclick={() => closeRejection()}
						disabled={actionByPosition[rejectionBio.position] === "reject"}
						>Cancel</button
					>
				</div>
			</form>
			{#if actionMessages[rejectionBio.position]}
				<p class="mt-3 text-red-700 dark:text-red-300" role="alert">
					{actionMessages[rejectionBio.position]}
				</p>
			{/if}
		</div>
	</Modal>
{/if}
