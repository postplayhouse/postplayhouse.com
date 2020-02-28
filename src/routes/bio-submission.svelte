<script>
  import { onMount } from "svelte"
  import site from "../data/site"
  import Bio from "../components/Bio.svelte"
  import Modal from "../components/Modal.svelte"
  import Markdown from "../components/Markdown.svelte"

  onMount(() => {
    if (!window.fetch) dispatch(events.foundNoFetch)
  })

  const MAX_WORDS = 125
  const PLACEHOLDER_IMAGE = "https://www.fillmurray.com/400/500"
  const EXAMPLE_BIO = `Don Denton is so happy to be returning to Post Playhouse after several years away. Though this time around, you won't see him on the stage. Instead, he will be directing this season's production of *Annie*. Some of Don's favorite memories were at Post Playhouse: Doing shows like *Hank Williams: Lost Highway*, and *Guys and Dolls*, working with Paige Salter. He and Paige are looking forward to making some new memories with their son, Marvin, who now gets to see the place Mommy and Daddy met. Visit [dondentonactor.com](https://dondentonactor.com) for more about Don.`

  let lastYearBios = `/who/${site.season - 1}`

  let passphrase = ""
  let firstName = ""
  let lastName = ""
  let image = ""
  let imageFile = null
  let location = ""
  let bio = ""
  let email = ""
  let useOldHeadshot = false

  let productions = [
    "Entire Season",
    "Cats",
    "Church Basement Ladies",
    "Annie",
    "Damn Yankees",
    "Catch Me If You Can",
  ]
  let roles = []
  let staffPositions = []
  let productionPositions = []
  let positions = []

  function updateRole(productionName, position, localRoles) {
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

  function mutateRoles(productionName, position) {
    roles = updateRole(productionName, position, roles)
  }

  $: name = firstName ? `${firstName} ${lastName}` : ""

  $: person = {
    name: name || "Bill Murray",
    image: useOldHeadshot ? "" : image || PLACEHOLDER_IMAGE,
    location: location || "Chicago, IL",
    roles,
    staffPositions,
    productionPositions,
    positions,
    bio:
      bio ||
      `Bill is thrilled (everyone says thrilled) to be making his Post Playhouse debut! Previous credits include _Ghostbusters_, _Groundhog Day_, and many more.`,
  }
  let toPersonFn = (x) => x

  let wordCount = (s) =>
    s
      .replace(/[_*]\w+\s+.*?[_*]/g, "SHOW TITLE")
      .replace(/[_*].*?[_*]/g, "SHOW")
      .split(/\s+/)
      .filter(Boolean).length

  $: bioWordCount = wordCount(bio)
  $: bioWordCountClass = (function() {
    if (bioWordCount > MAX_WORDS) {
      return "text-red-500"
    }
    if (bioWordCount > MAX_WORDS - 5) {
      return "text-orange-500"
    }
    return "text-black"
  })()

  $: validations = [
    { name: "wordCount", invalid: bioWordCount > MAX_WORDS },
    { name: "firstName", invalid: !firstName },
    { name: "location", invalid: !location },
    { name: "emptyBio", invalid: !bio },
    { name: "email", invalid: !email },
    { name: "image", invalid: !(imageFile || useOldHeadshot) },
    {
      name: "unclosedTitle",
      warn: (bio.match(/_/g) || []).length % 2 > 0,
    },
  ]

  const validationMessages = {
    firstName: "You must supply a first name.",
    location:
      "You must supply a location. That's like where you'd like people to know you are from.",
    wordCount: `Your bio is too long. Keep it at or under ${MAX_WORDS} words.`,
    emptyBio: "You must supply some kind of bio.",
    email:
      "Despite the fact that the stage manager has your email address, I need it attached to this form. Please add it.",
    image:
      "Use the green button near the top of the form to pick an image, or indicate you'd like to use one from a previous season.",
  }

  const warningMessages = {
    unclosedTitle:
      "Thanks for marking the titles of shows with underscores. But it looks like you didn't close one out. Check the preview above to see where it is. If you meant to have an actual underscore in your bio somewhere, that's fine.",
  }

  $: invalidForm = validations.some((v) => v.invalid === true)

  $: {
    if (invalidForm) dispatch(events.invalidatedForm)
    if (!invalidForm) dispatch(events.validatedForm)
  }

  const states = {
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

  let creds = undefined
  let badPassphrase = false
  let tries = 0

  let state = states.unauthenticated

  $: showCredsForm = [states.unauthenticated, states.requestingAuth].includes(
    state,
  )
  $: showMain = [
    states.incompleteForm,
    states.completeForm,
    states.sendingHeadshotBio,
  ].includes(state)
  $: submitting = [states.requestingAuth, states.sendingHeadshotBio].includes(
    state,
  )
  $: finalSubmission = state === states.sendingHeadshotBio
  $: showSuccess = state === states.success
  $: showError = state === states.error

  function dispatch(event, requirements) {
    if (event === events.foundNoFetch) {
      return (state = states.noFetch)
    }

    if (event === events.serverError) {
      return (state = states.error)
    }

    switch (state) {
      case states.unauthenticated: {
        switch (event) {
          case events.requestAuth:
            confirmPassphrase()
            return (state = states.requestingAuth)
          default:
            return
        }
      }
      case states.requestingAuth: {
        switch (event) {
          case events.confirmedPassphrase: {
            return (state = states.incompleteForm)
          }
          case events.badPassphrase: {
            badPassphrase = true
            return (state = states.unauthenticated)
          }
          case events.getCredsFailed: {
            return (state = states.error)
          }
          default:
            return
        }
      }
      case states.incompleteForm: {
        switch (event) {
          case events.validatedForm:
            return (state = states.completeForm)
          default:
            return
        }
      }
      case states.completeForm: {
        switch (event) {
          case events.invalidatedForm:
            return (state = states.incompleteForm)
          case events.postBio:
            handleSubmit()
            return (state = states.sendingHeadshotBio)
          default:
            return
        }
      }
      case states.sendingHeadshotBio: {
        switch (event) {
          case events.sendHeadshotBioFailure: {
            return (state = states.error)
          }
          case events.sendHeadshotBioSuccess: {
            return (state = states.success)
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

  function handleFilePick(e) {
    const pickedFile = e.target.files[0]
    if (!pickedFile || !pickedFile.type.match("image.*"))
      return (image = PLACEHOLDER_IMAGE)

    var reader = new FileReader()

    reader.onload = function(evt) {
      image = evt.target.result
      imageFile = pickedFile
    }

    reader.readAsDataURL(pickedFile)
  }

  const sanitizedPassphrase = (str) =>
    str
      .replace(/[^A-z ]/g, "")
      .toLowerCase()
      .trim()

  function confirmPassphrase() {
    return window
      .fetch(
        "https://happycollision-postplayhouse-bio-submission.builtwithdark.com/confirm-passphrase",
        {
          method: "GET",
          headers: new Headers({
            Authorization: sanitizedPassphrase(passphrase),
          }),
        },
      )
      .then((res) => {
        if (res.ok) {
          dispatch(events.confirmedPassphrase)
        } else if (res.status === 403) {
          dispatch(events.badPassphrase)
        } else {
          dispatch(events.serverError)
        }
      })
  }

  function getCreds(count = 2) {
    return window
      .fetch(
        `https://happycollision-postplayhouse-bio-submission.builtwithdark.com/upload-url?count=${count}`,
        {
          method: "GET",
          headers: new Headers({
            Authorization: sanitizedPassphrase(passphrase),
          }),
        },
      )
      .then((resp) => {
        if (resp.ok) return resp.json()
        else throw new Error("could not get creds")
      })
  }

  const safeName = (str) =>
    str
      .replace(/ +/g, "-")
      .replace(/[^A-z-]/g, "")
      .toLowerCase()

  const onSubmit = () => dispatch(events.postBio)

  $: yamlBody = ({ fillRoles, includeGroups } = {}) => {
    let localRoles = JSON.parse(JSON.stringify(roles))

    if (fillRoles) {
      productions.forEach((prod) => {
        const role = localRoles.find((r) => r.productionName === prod)
        if (!role) {
          localRoles = updateRole(prod, " ", localRoles)
        }
      })
    }

    const yamlRoles = localRoles
      .map(
        (r) =>
          `    ${r.productionName}:\n${r.positions
            .map((p) => `      - ${p.trim()}`)
            .join("\n")}`,
      )
      .join("\n")

    const allGroups = ["cast", "creative", "crew", "staff", "musicians"]
      .map((x) => `    - ${x}`)
      .join("\n")

    return [
      `- first_name: ${firstName.trim()}`,
      `  last_name: ${lastName.trim()}`,
      `  image_year: ${site.season}`,
      `  location: "${location.trim()}"`,
      includeGroups && `  group:\n${allGroups}`,
      `  roles:\n${yamlRoles}`,
      `  bio: >\n    ${bio.trim()}`,
      "\n",
    ]
      .filter(Boolean)
      .join("\n")
  }

  $: emailBody = `Please fill/double check the form below, including copy/pasting your bio directly into this email (no attachments for bios, please). Additionally, attach a headshot to this email. Thanks!

I'll email you when I have added your information to the website, so you can check that I got it right.


~Don Denton
----------------------------------------

${yamlBody({ fillRoles: true })}
`

  $: emailLink = `mailto:don@postplayhouse.com?subject=${encodeURIComponent(
    `Bio Submission: ${name || "YOUR NAME"}`,
  )}&body=${encodeURIComponent(emailBody)}`

  function uploadText(payload, basename, creds) {
    return window.fetch(creds.uploadUrl, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "b2/x-auto",
        Authorization: creds.authorizationToken,
        "X-Bz-Content-Sha1": "do_not_verify",
        "X-Bz-File-Name": `${basename}.txt`,
        "Content-Length": payload.length,
      }),
      body: payload,
    })
  }

  function uploadImage(imageFile, newFileBaseName, creds) {
    if (!imageFile) return Promise.reject("no image file provided")

    const { size, type, name } = imageFile
    const ext = name.slice([name.lastIndexOf(".") + 1])

    return window.fetch(creds.uploadUrl, {
      method: "POST",
      headers: new Headers({
        "Content-Type": type,
        Authorization: creds.authorizationToken,
        "X-Bz-Content-Sha1": "do_not_verify",
        "X-Bz-File-Name": `${newFileBaseName}.${ext}`,
        "Content-Length": size,
      }),
      body: imageFile,
    })
  }

  async function handleSubmit() {
    const basename = `${safeName(firstName)}-${safeName(
      lastName,
    )}_${Date.now()}`

    let bioTries = 0
    let headshotTries = 0

    const doBioUpload = async () =>
      uploadText(
        `${yamlBody({ includeGroups: true })}\n\n\n${email}`,
        basename,
        (await getCreds(1))[0],
      ).then((resp) => {
        if (resp.ok) {
          return true
        } else if (bioTries < 3) {
          bioTries++
          return getCreds(1).then((creds) => doBioUpload(creds[0]))
        } else {
          throw new Error("Could not upload Bio")
        }
      })

    const doHeadshotUpload = async () =>
      uploadImage(imageFile, basename, (await getCreds(1))[0]).then((resp) => {
        if (resp.ok) {
          return true
        } else if (headshotTries < 3) {
          headshotTries++
          return getCreds(1).then(doHeadshotUpload)
        } else {
          throw new Error("Could not upload Headshot")
        }
      })

    const jobs = [doBioUpload(), !useOldHeadshot && doHeadshotUpload()].filter(
      Boolean,
    )

    return Promise.all(jobs)
      .then(() => {
        dispatch(events.sendHeadshotBioSuccess)
      })
      .catch(() => dispatch(events.sendHeadshotBioFailure))
  }

  const submitCreds = () => dispatch(events.requestAuth)
  const noop = () => {}

  let showExample = false
  const toggleExample = () => (showExample = !showExample)
</script>

<svelte:head>
  <title>Post Playhouse: Bio Submission</title>
</svelte:head>

<h2 class="h2">Bio Submission</h2>

{#if state === states.noFetch}
  <div class="bg-red-200 text-red-900 p-4 rounded my-4">
    This submission form will not work from your device. Please send an email to
    <a class="link-green" href={emailLink}>don@postplayhouse.com</a>
  </div>
{/if}

<p>
  Have a look at
  <a class="link-green" href={lastYearBios}>last year's bios</a>
  if you'd like some context.
</p>

{#if showCredsForm}
  <form on:submit|preventDefault={submitCreds}>
    <label class="text-2xl block">
      Passphrase
      <div class="text-sm">
        This was given to you in the same communication that linked you to this
        page. If not, please contact the stage manager for the passphrase.
      </div>
      <input
        class="border border-grey-500 block"
        bind:value={passphrase}
        name="passphrase"
        type="text" />
    </label>
    {#if state === states.requestingAuth}
      <button class="btn btn-p mt-4" disabled>Checking...</button>
    {:else}
      <button class="btn btn-p mt-4">Continue</button>
    {/if}

    {#if badPassphrase}
      <span class="text-red-700">
        The passphrase you entered was incorrect.
      </span>
    {/if}
  </form>
{/if}

{#if showMain}
  <div class="mt-4 max-w-lg">
    <p>
      Please
      <strong>
        don't trust this form as a place to
        <em>compose</em>
        your bio.
      </strong>
      Write it first, then copy and paste in here. Never trust an internet
      connection with draft writing!
    </p>
    <p class="mt-4">
      If you have trouble with this form please compose an email with all the
      information we ask you for in this form and send it to
      <a class="link-green" href={emailLink}>don@postplayhouse.com</a>
    </p>
  </div>

  <div class="lg:flex mt-8">
    <form
      class="m-auto max-w-lg p-2 lg:w-1/2 flex-none"
      on:submit|preventDefault={noop}>

      <div>
        <div class="text-2xl block">Headshot</div>
        <label
          class="btn btn-p inline-block cursor-pointer {useOldHeadshot ? 'opacity-50' : ''}">
          {#if !imageFile}Choose a file{:else}Change file{/if}
          <input
            class="hidden"
            on:change={handleFilePick}
            name="headshot"
            accept="image/*"
            type="file" />
        </label>
        {#if image && !useOldHeadshot}
          <img
            style="max-width: 100px; max-height: 100px;"
            class="inline-block"
            src={image}
            alt={imageFile.name} />
        {/if}
        <label class="block mt-2">
          <input type="checkbox" bind:checked={useOldHeadshot} />
          Please use my headshot from last year instead
        </label>
      </div>

      <label class="text-2xl mt-8 block">
        Email address
        <div class="text-sm">
          (This is only so Don can contact you about your bio. It is not shared
          to our site or in our program.)
        </div>
        <input
          class="border border-grey-500 block"
          bind:value={email}
          name="email"
          type="email" />
      </label>

      <label class="text-2xl mt-8 block">
        First Name
        <div class="text-sm">(optionally with middle name/initial)</div>
        <input
          class="border border-grey-500 block"
          bind:value={firstName}
          name="firstName"
          type="text" />
      </label>

      <label class="text-2xl mt-8 block">
        Last Name
        <input
          class="border border-grey-500 block"
          bind:value={lastName}
          name="lastName"
          type="text" />
      </label>

      <label class="text-2xl mt-8 block">
        Location
        <div class="text-sm">
          (where you'd like people to know you are from. City and state, eg:
          "Crawford, NE")
        </div>
        <input
          class="border border-grey-500 block"
          bind:value={location}
          name="location"
          type="text" />
      </label>

      <div>
        <span class="text-2xl mt-24 block">Production Roles/Positions</span>
        <div class="text-sm">
          Please indicate what role you are playing or what your positions are
          for each production. Leave any blank that do not apply. Use commas to
          separate multiple positions/roles.
        </div>
        {#each productions as production, i}
          <label class="text-xl mt-4 block {i === 0 ? 'mb-8' : ''}">
            {production}
            <input
              class="border border-grey-500 block"
              type="text"
              on:input={(e) => mutateRoles(production, e.target.value)} />
            {#if i === 0}
              <div class="text-sm mt-1">
                <code class="text-xs bg-grey-300 rounded py-px px-1">
                  Box Office Staff
                </code>
                ,
                <code class="text-xs bg-grey-300 rounded py-px px-1">
                  Season Sound Engineer
                </code>
                , etc. Actors will likely leave this blank.
              </div>
            {/if}
            {#if i === 1}
              <div class="text-sm mt-1">
                <code class="text-xs bg-grey-300 rounded py-px px-1">
                  Skimbleshanks, Ensemble
                </code>
                ,
                <code class="text-xs bg-grey-300 rounded py-px px-1">
                  Assistant Stage Manager
                </code>
                , etc.
              </div>
            {/if}

          </label>
        {/each}
      </div>

      <label for="bio" class="text-2xl mt-24 block">Your Bio.</label>
      <ul>
        <li>
          You can create links with
          <code class="whitespace-no-wrap text-xs bg-grey-300 rounded p-1">
            [your text](http://yoursite.com)
          </code>
        </li>
        <li>
          Please surround the names of shows that you mention with
          <code class="text-xs bg-grey-300 rounded p-1">_underscores_</code>
          or
          <code class="text-xs bg-grey-300 rounded p-1">*asterisks*</code>
          . Properly notated show titles will only count as two words, maximum.
        </li>
      </ul>
      <div>
        <button class="btn btn-p my-2" on:click={toggleExample}>
          Show Example
        </button>
        {#if showExample}
          <Modal on:close={toggleExample}>
            <div class="max-w-md m-auto">
              <div class="text-2xl">This text...</div>
              <div class="font-mono text-sm bg-grey-200 p-2">{EXAMPLE_BIO}</div>
              <div class="text-2xl mt-8">...becomes this bio</div>
              <Markdown source={EXAMPLE_BIO} />
            </div>
          </Modal>
        {/if}

      </div>
      <textarea
        id="bio"
        name="bio"
        bind:value={bio}
        class="border border-grey-500 w-full font-mono min-h-96" />
      <div class={`text-right ${bioWordCountClass}`}>
        Word Count: {bioWordCount} out of a max of {MAX_WORDS}
      </div>

      <button
        class="btn btn-p mt-8 hidden lg:inline-block"
        disabled={invalidForm | submitting}
        on:click={onSubmit}>
        {#if submitting}Submitting{:else}Submit Bio{/if}
      </button>

    </form>

    <div>
      <div class="p-4 bg-grey-200 sticky top-0">
        <h3>Preview (your answers change this preview):</h3>
        <div class="bg-white rounded p-4 shadow-lg">
          <Bio {person} {toPersonFn} />
        </div>
        <div />
        {#each validations as validation (validation.name)}
          {#if validation.warn}
            <p class="mt-4">
              <span class="inline-block p-1 bg-orange-500 rounded" />
              {warningMessages[validation.name]}
            </p>
          {/if}
          {#if validation.invalid}
            <p class="mt-4">
              <span class="inline-block p-1 bg-red-500 rounded" />
              {validationMessages[validation.name]}
            </p>
          {/if}
        {/each}
        <button
          class="btn btn-p mt-8"
          disabled={invalidForm | submitting}
          on:click={onSubmit}>
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
    <a href="mailto:don@postplayhouse.com">don@postplayhouse.com</a>
    . So sorry for the inconvenience. If your phone/computer will allow it, I'll
    try and fill out some of the information for you if you click this button:
  </p>

  <a href={emailLink} class="btn btn-p inline-block mt-8">Email Don Denton</a>
{/if}
