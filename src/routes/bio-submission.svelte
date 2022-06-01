<script lang="ts">
  import { onMount } from "svelte"
  import site from "../data/site"
  import Bio from "../components/Bio.svelte"
  import Modal from "../components/Modal/Modal.svelte"
  import Markdown from "../components/Markdown.svelte"
  import type { Person } from "../models/Person"
  import { marked } from "marked"

  onMount(() => {
    if (!window.fetch) dispatch(events.foundNoFetch)
  })

  const MAX_WORDS = 125
  const PLACEHOLDER_IMAGE = "https://www.fillmurray.com/400/500"
  const EXAMPLE_BIO = `Don Denton is so happy to be returning to Post Playhouse after several years away. Though this time around, you won't see him on the stage. Instead, he will be directing this season's production of *Annie*. Some of Don's favorite memories were at Post Playhouse: Doing shows like *Hank Williams: Lost Highway*, and *Guys and Dolls*, working with Paige Salter. He and Paige are looking forward to making some new memories with their son, Marvin, who now gets to see the place Mommy and Daddy met. Visit [dondentonactor.com](https://dondentonactor.com) for more about Don.`

  let lastYearBios = `/who/${site.season - 3}`

  let passphrase = ""
  let firstName = ""
  let lastName = ""
  let image = ""
  let imageFile: null | File = null
  let location = ""
  let bio = ""
  let addLongerBio = false
  let longerBio = ""
  let email = ""
  let useOldHeadshot = false

  let productions = [
    "Entire Season",
    "The Sound of Music",
    "Church Basement Ladies",
    "Damn Yankees",
    "Something Rotten!",
    "Desperate Measures",
  ]
  let roles: Person["roles"] = []
  let staffPositions: Person["staffPositions"] = []
  let productionPositions: Person["productionPositions"] = []
  let positions: Person["positions"] = []

  function updateRole(
    productionName: string,
    position: string,
    localRoles: Person["roles"],
  ) {
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
    longerBio: addLongerBio ? longerBio : "",
  }

  let wordCount = (s: string) =>
    s
      .replace(/[_*]\w+\s+.*?[_*]/g, "SHOW TITLE")
      .replace(/[_*].*?[_*]/g, "SHOW")
      .split(/\s+/)
      .filter(Boolean).length

  $: bioWordCount = wordCount(bio)
  $: bioWordCountClass = (function () {
    if (bioWordCount > MAX_WORDS) {
      return "text-red-500"
    }
    if (bioWordCount > MAX_WORDS - 5) {
      return "text-orange-500"
    }
    return "text-black"
  })()

  $: longerBioWordCount = wordCount(longerBio)
  $: longerBioWordCountClass = (function () {
    if (longerBioWordCount <= MAX_WORDS) {
      return "text-red-500"
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
      name: "unclosedTitleUnderscore",
      warn: (bio.match(/_/g) || []).length % 2 > 0,
    },
    {
      name: "unclosedTitleAsterisk",
      warn: (bio.match(/\*/g) || []).length % 2 > 0,
    },
    {
      name: "noShowsPresent",
      warn:
        (bio.match(/_/g) || []).length === 0 &&
        (bio.match(/\*/g) || []).length === 0,
    },
    {
      name: "unclosedTitleUnderscoreLongerBio",
      warn: (longerBio.match(/_/g) || []).length % 2 > 0,
    },
    {
      name: "unclosedTitleAsteriskLongerBio",
      warn: (longerBio.match(/\*/g) || []).length % 2 > 0,
    },
    {
      name: "noShowsPresentLongerBio",
      warn:
        addLongerBio &&
        (longerBio.match(/_/g) || []).length === 0 &&
        (longerBio.match(/\*/g) || []).length === 0,
    },
    { name: "longerBioIsEmpty", warn: addLongerBio && !longerBio },
    {
      name: "longerBioIsShort",
      invalid: addLongerBio && longerBioWordCount <= MAX_WORDS,
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
    longerBioIsShort: `If your longer bio for the website is ${MAX_WORDS} or less, please don't submit two bios. (Uncheck the additional bio box)`,
  }

  const warningMessages = {
    noShowsPresent:
      "It looks like your bio doesn't include the titles of any productions you've been involved with. That's fine. But if you <em>meant to</em> include titles, you probably forgot to surround them with either asterisks or underscores. See the instructions above the bio field for how to notate show titles.",
    noShowsPresentLongerBio:
      "It looks like your longer bio for the website doesn't include the titles of any productions you've been involved with. That's fine. But if you <em>meant to</em> include titles, you probably forgot to surround them with either asterisks or underscores. See the instructions above the bio field for how to notate show titles.",
    unclosedTitleUnderscore:
      "If you meant to have an actual underscore (<code>_</code>) in you bio, you can ignore this warning. Otherwise you may have been marking your show titles and forgot to close one out. Check the preview above to see where it is.",
    unclosedTitleUnderscoreLongerBio:
      "If you meant to have an actual underscore (<code>_</code>) in your longer bio for the website, you can ignore this warning. Otherwise you may have been marking your show titles and forgot to close one out. Check the preview above to see where it is.",
    unclosedTitleAsterisk:
      "If you meant to have an actual asterisk (<code>*</code>) in your bio, you can ignore this warning. Otherwise you may have been marking your show titles and forgot to close one out. Check the preview above to see where it is.",
    unclosedTitleAsteriskLongerBio:
      "If you meant to have an actual asterisk (<code>*</code>) in your longer bio for the website, you can ignore this warning. Otherwise you may have been marking your show titles and forgot to close one out. Check the preview above to see where it is.",
    longerBioIsEmpty:
      "You checked the box that you'd like to add a longer bio for the website, but then you left it empty. That's fine, I'll just use the other bio.",
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

  let badPassphrase = false

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

  function dispatch(event: string) {
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

  function handleFilePick(
    e: Parameters<svelte.JSX.FormEventHandler<HTMLInputElement>>[0],
  ) {
    const pickedFile = e.currentTarget.files?.[0]
    if (!pickedFile || !pickedFile.type.match("image.*"))
      return (image = PLACEHOLDER_IMAGE)

    var reader = new FileReader()

    reader.onload = function (evt) {
      image = evt.target?.result as string
      imageFile = pickedFile
    }

    reader.readAsDataURL(pickedFile)
  }

  const sanitizedPassphrase = (str: string) =>
    str
      .replace(/[^A-z ]/g, "")
      .toLowerCase()
      .trim()

  async function confirmPassphrase() {
    const res = await window.fetch(
      "https://happycollision-postplayhouse-bio-submission.builtwithdark.com/confirm-passphrase",
      {
        method: "GET",
        headers: new Headers({
          Authorization: sanitizedPassphrase(passphrase),
        }),
      },
    )
    if (res.ok) {
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
      `https://happycollision-postplayhouse-bio-submission.builtwithdark.com/upload-url?count=${count}`,
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
      .replace(/ +/g, "-")
      .replace(/[^A-z-]/g, "")
      .toLowerCase()

  const onSubmit = () => dispatch(events.postBio)

  $: yamlBody = ({
    fillRoles,
    includeGroups,
  }: { fillRoles?: boolean; includeGroups?: boolean } = {}) => {
    let localRoles: typeof roles = JSON.parse(JSON.stringify(roles))

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
      includeGroups && `  groups:\n${allGroups}`,
      `  roles:\n${yamlRoles}`,
      !addLongerBio && `  bio: |\n    ${bio.trim()}`,
      addLongerBio && `program_bio: |\n    ${bio.trim()}`,
      addLongerBio && `longer_website_bio: |\n    ${longerBio.trim()}`,
      "\n",
    ]
      .filter(Boolean)
      .join("\n")
  }

  $: emailBody = `Please fill/double check the form below, including copy/pasting your bio directly into this email (no attachments for bios, please). Remember that you must submit either one bio that is 125 words or less (show titles count for a maximum of two words), or two bios where one is 125 words or less for the printed program and the other is longer for the website.

Additionally, attach a headshot to this email. Thanks!

I'll email you when I have added your information to the website, so you can check that I got it right.


~Don Denton
----------------------------------------

${yamlBody({ fillRoles: true })}
`

  $: emailLink = `mailto:don@postplayhouse.com?subject=${encodeURIComponent(
    `Bio Submission: ${name || "YOUR NAME"}`,
  )}&body=${encodeURIComponent(emailBody)}`

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
    const basename = `${safeName(firstName)}-${safeName(
      lastName,
    )}_${Date.now()}`

    let bioTries = 0
    let headshotTries = 0

    const messageToMyself = `
bio words:        ${bioWordCount}
longer bio words: ${addLongerBio ? longerBioWordCount : "n/a"}

Don't forget:

1. change \`roles\` to \`production_positions\` for non-cast members
2. move anything from \`Entire Season\` to \`staff_positions\`
3. delete all incorrect group memberships for each person
4. if two bios, change \`longer_website_bio\` to \`bio\`

${email}
`

    const doBioUpload = async (): Promise<true> =>
      uploadText(
        `${yamlBody({
          includeGroups: true,
        })}\n\n\n${messageToMyself}`,
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
    <a class="link-green" href="{emailLink}">don@postplayhouse.com</a>
  </div>
{/if}

{#if state !== states.success}
  <p>
    Have a look at
    <a class="link-green" href="{lastYearBios}">last year's bios</a>
    if you'd like some context.
  </p>
{/if}

{#if showCredsForm}
  <form on:submit|preventDefault="{submitCreds}">
    <label class="text-2xl block">
      Passphrase
      <div class="text-sm">
        This was given to you in the same communication that linked you to this
        page. If not, please contact the stage manager for the passphrase.
      </div>
      <input
        class="border border-grey-500 block"
        bind:value="{passphrase}"
        name="passphrase"
        type="text"
      />
    </label>
    {#if state === states.requestingAuth}
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
  <div class="mt-4 max-w-lg">
    <p>
      Please
      <strong>
        don't trust this form as a place to
        <em>compose</em>
        your bio.
      </strong>
      Write it first, then copy and paste in here. Never trust an internet connection
      with draft writing!
    </p>
    <p class="mt-4">
      If you have trouble with this form please compose an email with all the
      information we ask you for in this form and send it to
      <a class="link-green" href="{emailLink}">don@postplayhouse.com</a>
    </p>
  </div>

  <div class="lg:flex mt-8">
    <form
      class="m-auto max-w-lg p-2 lg:w-1/2 flex-none"
      on:submit|preventDefault="{noop}"
    >
      <div>
        <div class="text-2xl block">Headshot</div>
        <label
          class="btn btn-p inline-block cursor-pointer {useOldHeadshot
            ? 'opacity-50'
            : ''}"
        >
          {#if !imageFile}Choose a file{:else}Change file{/if}
          <input
            class="hidden"
            on:change="{handleFilePick}"
            name="headshot"
            accept="image/*"
            type="file"
          />
        </label>
        {#if image && !useOldHeadshot}
          <img
            style="max-width: 100px; max-height: 100px;"
            class="inline-block"
            src="{image}"
            alt="{imageFile?.name}"
          />
        {/if}
        <label class="block mt-2">
          <input type="checkbox" bind:checked="{useOldHeadshot}" />
          I've worked at Post before. Please use my headshot from last time instead.
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
          bind:value="{email}"
          name="email"
          type="email"
        />
      </label>

      <label class="text-2xl mt-8 block">
        First Name
        <div class="text-sm">(optionally with middle name/initial)</div>
        <input
          class="border border-grey-500 block"
          bind:value="{firstName}"
          name="firstName"
          type="text"
        />
      </label>

      <label class="text-2xl mt-8 block">
        Last Name
        <input
          class="border border-grey-500 block"
          bind:value="{lastName}"
          name="lastName"
          type="text"
        />
      </label>

      <label class="text-2xl mt-8 block">
        Location
        <div class="text-sm">
          (where you'd like people to know you are from. City and state, eg:
          "Crawford, NE")
        </div>
        <input
          class="border border-grey-500 block"
          bind:value="{location}"
          name="location"
          type="text"
        />
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
              on:input="{(e) => mutateRoles(production, e.currentTarget.value)}"
            />
            {#if i === 0}
              <div class="text-sm mt-1">
                (Actors will most likely leave this one blank.)<br />
                Examples:<br />
                <code class="text-xs bg-grey-300 rounded py-px px-1"
                  >Box Office Staff</code
                ><br />
                <code class="text-xs bg-grey-300 rounded py-px px-1"
                  >Season Sound Engineer</code
                >
              </div>
            {/if}
            {#if i === 1}
              <div class="text-sm mt-1">
                Examples: <br />
                <code class="text-xs bg-grey-300 rounded py-px px-1"
                  >Franz, Ensemble</code
                ><br />
                <code class="text-xs bg-grey-300 rounded py-px px-1"
                  >Assistant Stage Manager</code
                >
              </div>
            {/if}
          </label>
        {/each}
      </div>

      <label for="bio" class="text-2xl mt-24 block"
        >Program {#if !addLongerBio}and Website{/if} Bio</label
      >

      <div class="bg-gray-200 rounded p-2 my-2">
        Formatting directions:
        <ul>
          <li>
            You can create links with
            <code class="whitespace-nowrap text-xs bg-grey-400 rounded p-1">
              [your text](http://yoursite.com)
            </code>
          </li>
          <li>
            Please surround the names of shows that you mention with
            <code class="text-xs bg-grey-400 rounded p-1">_underscores_</code>
            or
            <code class="text-xs bg-grey-400 rounded p-1">*asterisks*</code>.
            Properly notated show titles will only count as two words, maximum.
          </li>
        </ul>
        <button class="btn btn-p mt-2" on:click="{toggleExample}">
          Show Example
        </button>
      </div>
      <div>
        {#if showExample}
          <Modal on:close="{toggleExample}">
            <div class="max-w-md m-auto">
              <div class="text-2xl">This text...</div>
              <div class="font-mono text-sm bg-grey-200 p-2">{EXAMPLE_BIO}</div>
              <div class="text-2xl mt-8">...becomes this bio</div>
              <Markdown source="{EXAMPLE_BIO}" />
            </div>
          </Modal>
        {/if}
      </div>
      <textarea
        id="bio"
        name="bio"
        bind:value="{bio}"
        class="border border-grey-500 w-full font-mono min-h-96"></textarea>
      <div class="{`text-right ${bioWordCountClass}`}">
        Word Count:
        {bioWordCount}
        out of a max of
        {MAX_WORDS}
      </div>

      <label class="block my-2">
        <input type="checkbox" bind:checked="{addLongerBio}" />
        <span class="text-sm">
          I'd like to submit an additional bio longer than {MAX_WORDS} words for
          the website. I understand that
          <strong>either bio may be used for the printed program</strong>, but
          it will be at the sole discretion of the person laying out the
          program.
        </span>
      </label>

      {#if addLongerBio}
        <div>
          <label for="longerBio" class="text-2xl mt-8 block">Website Bio</label>
          <textarea
            id="longerBio"
            name="longerBio"
            bind:value="{longerBio}"
            class="border border-grey-500 w-full font-mono min-h-96"></textarea>
          <div class="{`text-right ${longerBioWordCountClass}`}">
            Word Count:
            {longerBioWordCount} (must be <em>more than</em> 125 words, otherwise
            only submit one bio please)
          </div>
        </div>
      {/if}

      <button
        class="btn btn-p mt-8 hidden lg:inline-block"
        disabled="{invalidForm || submitting}"
        on:click="{onSubmit}"
      >
        {#if submitting}Submitting{:else}Submit Bio{/if}
      </button>
    </form>

    <div>
      <div class="p-4 bg-grey-200 sticky top-0">
        <h3>Preview (your answers change this preview):</h3>
        <div class="bg-white rounded p-4 shadow-lg">
          <Bio person="{person}" />
        </div>
        {#if addLongerBio}<div class="mt-8">
            <header>Website Bio:</header>
            <div class="bg-white rounded shadow-lg p-2">
              {@html marked.parse(longerBio || "(Empty)")}
            </div>
          </div>{/if}
        {#if validations.length > 0}
          <ul class="list-none p-0">
            {#each validations as validation (validation.name)}
              {#if validation.invalid}
                <li class="mt-4">
                  <span class="inline-block p-1 bg-red-500 rounded"></span>
                  {@html validationMessages[validation.name]}
                </li>
              {/if}
              {#if validation.warn}
                <li
                  class="mt-4 border border-yellow-500 bg-yellow-100 p-2 rounded prose"
                >
                  <header class="font-bold text-yellow-600">Warning:</header>
                  <p>{@html warningMessages[validation.name]}</p>
                </li>
              {/if}
            {/each}
          </ul>
        {/if}
        <button
          class="btn btn-p mt-8"
          disabled="{invalidForm || submitting}"
          on:click="{onSubmit}"
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

  <a href="{emailLink}" class="btn btn-p inline-block mt-8">Email Don Denton</a>
{/if}
