<script>
  import { onMount } from "svelte"
  import site from "../data/site"
  import Bio from "../components/Bio.svelte"
  import Modal from "../components/Modal.svelte"

  onMount(() => {
    if (!window.fetch) dispatch(events.foundNoFetch)
  })

  const MAX_WORDS = 125
  const PLACEHOLDER_IMAGE = "https://www.fillmurray.com/400/500"

  let lastYearBios = `/who/${site.season - 1}`

  let passphrase = ""
  let firstName = ""
  let lastName = ""
  let image = PLACEHOLDER_IMAGE
  let imageFile = null
  let location = ""
  let bio = ""
  let email = ""

  let productions = [
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

  function updateRole(productionName, position) {
    const updatedRole = {
      productionName,
      positions: position
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    }

    const existing = roles.findIndex((r) => r.productionName === productionName)

    if (existing > -1) {
      roles = roles
        // replace the old production only
        .map((r, i) => (i === existing ? updatedRole : r))
        // Remove the production if they clear the field
        .filter((r) => r.positions.length)
    } else {
      roles = [...roles, updatedRole].sort(
        (a, b) =>
          productions.findIndex((show) => show === a.productionName) -
          productions.findIndex((show) => show === b.productionName),
      )
    }

    console.log(roles)
  }

  $: name = firstName ? `${firstName} ${lastName}` : ""

  $: person = {
    name,
    image,
    location,
    roles,
    staffPositions,
    productionPositions,
    positions,
    bio:
      bio ||
      `${name} is thrilled (everyone says thrilled) to be making their Post Playhouse debut! Previous credits include _A Show_ and _Another Show: The Musical!_.`,
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
    { name: "image", invalid: !imageFile },
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
      "The Stage Manager already has your email address, true. But I need it separately because Ken is always very busy working on other issues. It is just to contact you about your bio.",
    image:
      "This image of Bill Murray will not do for you. Use the green button near the top of the form to pick an image.",
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
      window.imageFile = pickedFile
    }

    reader.readAsDataURL(pickedFile)
  }

  const sanitizedPassphrase = (str) => str.replace(/[^A-z ]/g, "").trim()

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

  let yamlBody

  $: {
    const yamlRoles = roles
      .map(
        (r) =>
          `    ${r.productionName}:\n${r.positions
            .map((p) => `      - ${p}`)
            .join("\n")}`,
      )
      .join("\n")

    yamlBody = [
      `- first_name: ${firstName}`,
      `  last_name: ${lastName}`,
      `  location: "${location}"`,
      `  roles:\n${yamlRoles}`,
      `  bio: >\n    ${bio}`,
      "\n",
    ].join("\n")
  }

  $: emailBody = `Please fill out the form below, don't send a bio that is an attachment. Additionally, attach a headshot (jpeg is preferred, but PDF is ok) to this email (or add a link where I can download it).  Thanks!

I'll email you when I have added your information to the website, so you can check that I got it right.


~Don Denton
----------------------------------------

${yamlBody}
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
        `${yamlBody}\n\n\n\n\n${email}`,
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

    return Promise.all([doBioUpload(), doHeadshotUpload()])
      .then(() => {
        dispatch(events.sendHeadshotBioSuccess)
      })
      .catch(() => dispatch(events.sendHeadshotBioFailure))
  }

  const submitCreds = () => dispatch(events.requestAuth)
  const noop = () => {}
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

{#if showCredsForm}
  <form on:submit|preventDefault={submitCreds}>
    <label class="text-2xl block">
      Passphrase
      <div class="text-sm">
        You will have received this in the email telling you about this bio
        submission form.
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
  <p>
    This form will show you how your bio will be rendered on the website. Have a
    look at
    <a class="link-green" href={lastYearBios}>last year's bios</a>
    if you'd like some context. We do reserve the right to edit your bio
    slightly if needs be. Usually this is due to length restrictions when
    printing.
  </p>
  <p class="mt-4">
    When you are done, check the preview and then submit your bio. It will be
    reviewed and added to the website in time.
  </p>
  <p class="mt-4">
    I built this very quickly, so please
    <strong>
      don't trust it as a place to
      <em>compose</em>
      your bio.
    </strong>
    Write it first, then copy and paste in here.
  </p>
  <p>
    If you have trouble with this form please compose an email with all the
    information we ask you for in this form and send it to
    <a class="link-green" href={emailLink}>don@postplayhouse.com</a>
  </p>

  <div class="lg:flex mt-8">
    <form
      class="m-auto max-w-lg p-2 lg:w-1/2 flex-none"
      on:submit|preventDefault={noop}>

      <label class="text-2xl block">
        Headshot
        <input
          class="btn btn-p max-w-sm block"
          on:change={handleFilePick}
          name="headshot"
          accept="image/*"
          type="file" />
      </label>

      <label class="text-2xl mt-8 block">
        Email address
        <div class="text-sm">
          (This is only so Don can contact you about your bio. It is not shared
          to our site.)
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
        <div class="text-sm">(city and state, eg: "Crawford, NE")</div>
        <input
          class="border border-grey-500 block"
          bind:value={location}
          name="location"
          type="text" />
      </label>

      <div>
        <span class="text-2xl mt-24 block">Production Roles/Positions</span>
        <div class="text-sm">
          Please indicate what role you are playing or what your position is for
          each production. If you work in the box office, you may write "Box
          Office" next to any production. You may leave blank any productions
          that you are not involved with.
        </div>
        {#each productions as production}
          <label class="text-xl mt-4 block">
            {production}
            <input
              class="border border-grey-500 block"
              type="text"
              on:input={(e) => updateRole(production, e.target.value)} />
          </label>
        {/each}
      </div>

      <label for="bio" class="text-2xl mt-24 block">Your Bio.</label>
      <ul>
        <li>
          You can create links with
          <code class="whitespace-no-wrap bg-grey-300 rounded p-1 text-sm">
            [your text](http://yoursite.com)
          </code>
        </li>
        <li>
          Please surround the names of shows that you mention with
          <code class="whitespace-no-wrap bg-grey-300 rounded p-1 text-sm">
            _underscores_
          </code>
          or
          <code class="whitespace-no-wrap bg-grey-300 rounded p-1 text-sm">
            *asterisks*
          </code>
          . Properly notated show titles will only count as two words, maximum.
        </li>
        <li>
          See the preview of your bio
          <span class="md:hidden">below</span>
          <span class="hidden md:inline">to the right</span>
          to check that you have done it correctly.
        </li>
      </ul>
      <div>
        Example from 2015
        <div class="font-mono text-sm bg-grey-200 p-2">
          Don is happy to be returning to Post Playhouse for another amazing
          summer! Favorite professional credits include Joseph in *Joseph and
          the Amazing Technicolor Dreamcoat* (Circa &rsquo;21 Dinner Playhouse,
          Rock Island, IL), Sky Masterson in *Guys &amp; Dolls* (Post
          Playhouse), Sir Bliant in *Camelot* (Drury Lane Theatre, Chicago),
          Bernard in *Boeing Boeing* (Wayside Theatre, Middletown, VA) and Jean
          Valjean in *Les Mis&eacute;rables* (Circa &rsquo;21). Thanks to Tom
          and all the staff at Post. Thanks to mom, dad, Dan, Amber, and little
          Oliver. Thanks to Kim, WP, Peter, and Carol. Thanks to God. For more,
          visit [dondentonactor.com](http://dondentonactor.com).
        </div>

      </div>
      <div class={bioWordCountClass}>
        Word Count: {bioWordCount} out of a max of {MAX_WORDS}
      </div>
      <textarea
        id="bio"
        name="bio"
        bind:value={bio}
        class="border border-grey-500 w-full font-mono min-h-64" />

      <button
        class="btn btn-p mt-8"
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
