<script>
  export let segment

  function nodeIsActive(node, segment) {
    const path = node.href.split("/").pop()
    return path === "" ? segment === undefined : path === segment
  }

  function manageNodeActiveClass(node, segment) {
    if (nodeIsActive(node, segment)) {
      node.classList.add("active")
    } else {
      node.classList.remove("active")
    }
  }

  function active(node, segment) {
    manageNodeActiveClass(node, segment)

    return {
      update(segment) {
        manageNodeActiveClass(node, segment)
      },
    }
  }
</script>

<style>
  nav {
    border-bottom: 1px solid rgba(62, 155, 50, 0.1);
    font-weight: 300;
    padding: 0 1em;
  }

  ul {
    padding: 0;
  }

  /* clearfix */
  ul::after {
    content: "";
    display: block;
    clear: both;
  }

  li {
    display: block;
    float: left;
  }

  .main-nav :global(.active) {
    position: relative;
    display: inline-block;
  }

  .main-nav :global(.active::after) {
    position: absolute;
    content: "";
    width: calc(100% - 1em);
    height: 2px;
    background-color: rgb(62, 155, 50);
    display: block;
    bottom: -1px;
  }

  a {
    text-decoration: none;
    padding: 1em 0.5em;
    display: block;
  }
</style>

<nav class="main-nav">
  <ul class="m-auto max-w-3xl">
    <li>
      <a use:active={segment} href=".">home</a>
    </li>
    <li>
      <a use:active={segment} href="about">about</a>
    </li>
    <li>
      <a use:active={segment} href="calendar">calendar</a>
    </li>
  </ul>
</nav>
